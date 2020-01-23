import {AsyncSubject, Subject} from 'rxjs';
import {map, mapTo, switchMap, takeUntil} from 'rxjs/operators';
import {boundMethod} from 'autobind-decorator';
import uuid from 'uuid/v4';

import {IConnectionConfig, IClientMessage, IServerMessage} from '../types';
import {unpackResponseData} from '../packstream';
import {createMessage, getAuthMessage, getHandshakeMessage, joinArrayBuffers} from './connection.utils';
import {BOLT_PROTOCOLS} from './connection.constants';
import {InvalidOperationError} from '../errors';

export default class Connection<Data extends any = any> extends Subject<IServerMessage<Data>> {
    public readonly id = uuid();

    protected readonly socket: WebSocket;
    protected protocol: BOLT_PROTOCOLS = BOLT_PROTOCOLS.UNKNOWN;
    protected didAuth: boolean = false;
    protected incomingData = new ArrayBuffer(0);
    protected readySubject = new AsyncSubject<void>();
    protected terminationSubject = new AsyncSubject<void>();
    protected isTerminated = false;

    constructor(protected readonly config: IConnectionConfig<Data>) {
        super();

        this.socket = new WebSocket(
            `${config.secure ? 'wss' : 'ws'}://${config.host}:${config.port}`
        );
        this.socket.binaryType = 'arraybuffer';
        this.socket.onopen = this.onOpen;
        this.socket.onmessage = this.onMessage;
        this.socket.onerror = this.onError;
        this.socket.onclose = this.onClose;
    }

    private get didHandshake() {
        return this.protocol !== BOLT_PROTOCOLS.UNKNOWN;
    }

    private get isReady() {
        return this.didHandshake && this.didAuth;
    }

    @boundMethod
    public sendMessage(message: IClientMessage) {
        if (this.isTerminated) {
            throw new InvalidOperationError(`Connection ${this.id} is terminated`);
        }

        return this.readySubject.pipe(
            takeUntil(this.terminationSubject),
            map(() => {
                const {cmd, data, additionalData} = message;
                const allData = additionalData
                    ? [...data, ...additionalData(this.protocol)]
                    : [...data];

                this.socket.send(createMessage<Data>(this.protocol, cmd, allData, this.config.packer));
            }),
            switchMap(() => this)
        )
    }

    @boundMethod
    public terminate(): Promise<this> {
        if (this.isTerminated) {
            return Promise.resolve(this);
        }

        this.isTerminated = true;
        this.terminationSubject.next();
        this.terminationSubject.complete();

        return this.terminationSubject.pipe(
            map(() => {
                this.socket.close()
            }),
            mapTo(this)
        // @todo: not very graceful
        ).toPromise();
    }

    @boundMethod
    private onOpen() {
        this.socket.send(getHandshakeMessage());
    }

    @boundMethod
    private onClose() {
        this.complete();
    }

    @boundMethod
    private onData(view: DataView) {
        this.incomingData = joinArrayBuffers(this.incomingData, view.buffer);

        let messageData = new ArrayBuffer(0);
        let endOfChunk = 2;

        while (this.incomingData.byteLength >= 2) {
            const header = new Uint8Array(this.incomingData);
            const chunkSize = header[0] << 8 | header[1];

            endOfChunk = 2 + chunkSize;

            if (chunkSize) {
                messageData = joinArrayBuffers(messageData, this.incomingData.slice(2, endOfChunk));
                this.incomingData = this.incomingData.slice(endOfChunk);

                continue;
            }

            this.onChunk(new DataView(messageData));

            messageData = new ArrayBuffer(0);
            this.incomingData = this.incomingData.slice(endOfChunk);
        }
    }

    @boundMethod
    private onChunk(view: DataView) {
        const {data} = unpackResponseData<Data>(this.protocol, view, this.config.unpacker);

        this.next({
            // @todo: cleanup
            header: this.config.getResponseHeader!(data),
            data: this.config.getResponseData!(data)
        });
    }

    @boundMethod
    private onHandshake(data: DataView) {
        this.protocol = data.getInt32(0, false);

        this.socket.send(getAuthMessage(this.protocol, this.config, this.config.packer));
    }

    @boundMethod
    private onAuth(_: DataView) {
        this.didAuth = true;

        // signal ready to send messages
        this.readySubject.next();
        this.readySubject.complete();
    }

    @boundMethod
    private onMessage(event: Event) {
        // @ts-ignore
        const data = new DataView(event.data);

        if (this.isReady) {
            this.onData(data);

            return;
        }

        if (this.didHandshake) {
            this.onAuth(data);

            return;
        }

        this.onHandshake(data);
    }

    @boundMethod
    private onError(err: any) {
        this.error(err);
    }
}
