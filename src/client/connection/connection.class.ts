import {AsyncSubject, Subject} from 'rxjs';
import autobind from 'autobind-decorator';
import uuid from 'uuid/v4';

import {IConnectionParams} from '../types';
import {DRIVER_COMMANDS, DRIVER_HEADERS} from '../driver.constants';
import {unpackResponseData} from '../packstream';
import {createMessage, getAuthMessage, getHandshakeMessage, joinArrayBuffers} from './connection.utils';
import {BOLT_PROTOCOLS} from './connection.constants';
import {map, switchMap, takeUntil} from 'rxjs/operators';

export interface IMessage<Data = any> {
    header: DRIVER_HEADERS;
    data: Data;
}

export default class Connection<Data extends any = any> extends Subject<IMessage<Data>> {
    public readonly id = uuid();

    protected readonly socket: WebSocket;
    protected protocol: BOLT_PROTOCOLS = BOLT_PROTOCOLS.UNKNOWN;
    protected didAuth: boolean = false;
    protected incomingData = new ArrayBuffer(0);
    protected readySubject = new AsyncSubject<void>();
    protected terminationSubject = new AsyncSubject<void>();

    constructor(protected readonly connectionParams: IConnectionParams<Data>) {
        super();

        this.socket = new WebSocket(
            `${connectionParams.secure ? 'wss' : 'ws'}://${connectionParams.host}:${connectionParams.port}`
        );
        this.socket.binaryType = 'arraybuffer';
        this.socket.onopen = this.onOpen;
        this.socket.onmessage = this.onMessage;
        this.socket.onerror = this.onError;
        this.socket.onclose = this.onClose;
    }

    // @todo: figure out what this should actually do and return and stuff
    public sendMessage(cmd: DRIVER_COMMANDS, data: any[]) {
        return this.readySubject.pipe(
            takeUntil(this.terminationSubject),
            map(() => {
                this.socket.send(createMessage<Data>(this.protocol, cmd, data, this.connectionParams.packer));
            }),
            switchMap(() => this)
        ).toPromise();
    }

    // @todo: not very graceful
    public terminate() {
        this.terminationSubject.next();
        this.terminationSubject.complete();

        return this.terminationSubject.pipe(
            map(() => {
                this.socket.close()
            })
        ).toPromise();
    }

    private get didHandshake() {
        return this.protocol !== BOLT_PROTOCOLS.UNKNOWN;
    }

    private get isReady() {
        return this.didHandshake && this.didAuth;
    }

    @autobind
    private onOpen() {
        this.socket.send(getHandshakeMessage());
    }

    @autobind
    private onClose(val: any) {
        console.log('onClose', val);

        this.complete();
    }

    @autobind
    private onData(view: DataView) {
        this.incomingData = joinArrayBuffers(this.incomingData, view.buffer);

        let messageData = new ArrayBuffer(0);
        let endOfChunk = 2;

        while (this.incomingData.byteLength >= endOfChunk) {
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

        // emit once more if we have complete chunks
        // @todo: improve check for incomingData being two 0's
        if (this.incomingData.byteLength === 2) {
            this.onChunk(new DataView(messageData));
        }
    }

    // @todo: better name
    @autobind
    private onChunk(view: DataView) {
        const {data} = unpackResponseData<Data>(this.protocol, view, this.connectionParams.unpacker);

        this.next({
            // @todo: cleanup
            header: this.connectionParams.getHeader!(data),
            data: this.connectionParams.getData!(data)
        });
    }

    @autobind
    private onHandshake(data: DataView) {
        this.protocol = data.getInt32(0, false);

        this.socket.send(getAuthMessage(this.protocol, this.connectionParams, this.connectionParams.packer));
    }

    @autobind
    private onAuth(_: DataView) {
        this.didAuth = true;

        // signal ready to send messages
        this.readySubject.next();
        this.readySubject.complete();
    }

    @autobind
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

    @autobind
    private onError(err: any) {
        this.error(err);
    }
}
