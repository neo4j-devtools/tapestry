import {AsyncSubject, Subject} from 'rxjs';
import {map, mapTo, switchMap, takeUntil} from 'rxjs/operators';
import {boundMethod} from 'autobind-decorator';
import uuid from 'uuid/v4';

import {IClientMessage, IConnectionConfig, IServerMessage} from '../types';
import {unpackResponseData} from '../packstream';
import {createMessage, getAuthMessage, getHandshakeMessage, joinArrayBuffers} from './connection.utils';
import {BOLT_PROTOCOLS} from './connection.constants';
import {AuthenticationError, InvalidOperationError} from '../errors';
import {DRIVER_HEADERS} from '../driver';

export default class Connection<Data extends any = any> extends Subject<IServerMessage<Data>> {
    public readonly id = uuid();

    protected readonly socket: WebSocket;
    protected ourProtocol: BOLT_PROTOCOLS = BOLT_PROTOCOLS.UNKNOWN;
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

    public get address() {
        return `${this.config.host}:${this.config.port}`;
    }

    public get protocol() {
        return this.ourProtocol;
    }

    private get didHandshake() {
        return this.ourProtocol !== BOLT_PROTOCOLS.UNKNOWN;
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
                    ? [...data, ...additionalData(this.ourProtocol)]
                    : [...data];

                this.socket.send(createMessage<Data>(this.ourProtocol, cmd, allData, this.config.packer));
            }),
            switchMap(() => this)
        );
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
                this.socket.close();
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
        this.terminate().then(() => this.complete());
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
        const {data} = unpackResponseData<Data>(this.ourProtocol, view, this.config.unpacker);

        if (this.isReady) {
            this.next({
                // @todo: cleanup
                header: this.config.getResponseHeader!(data),
                data: this.config.getResponseData!(data)
            });

            return;
        }

        this.onAuth(data);
    }

    @boundMethod
    private onHandshake(data: DataView) {
        this.ourProtocol = data.getInt32(0, false);

        this.socket.send(getAuthMessage(this.ourProtocol, this.config, this.config.packer));
    }

    @boundMethod
    private onAuth(data: Data) {
        // @todo: cleanup
        const result = this.config.getResponseHeader!(data);

        if (result !== DRIVER_HEADERS.SUCCESS) {
            this.error(new AuthenticationError(`${this.config.getResponseData!(data)}`));

            return;
        }

        this.didAuth = true;

        // signal ready to send messages
        this.readySubject.next();
        this.readySubject.complete();
    }

    @boundMethod
    private onMessage(event: Event) {
        // @ts-ignore
        const data = new DataView(event.data);

        if (this.didHandshake) {
            this.onData(data);
            return
        }

        this.onHandshake(data);
    }

    @boundMethod
    private onError(err: any) {
        this.terminate().then(() => this.error(err));
    }
}
