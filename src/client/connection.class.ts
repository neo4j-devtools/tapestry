import {merge} from 'lodash';
import autobind from 'autobind-decorator';

import {unpackResponseData, Packer, Unpacker} from './packstream';
import {getAuthMessage, getHandshakeMessage, getRetrieveMessage, getTestMessage, joinArrayBuffers} from './connection.utils';
import {BOLT_PROTOCOLS} from './connection.constants';

export interface IAuth {
    scheme: 'basic',
    principal: string,
    credentials: string;
}

export interface IConnectionParams {
    secure?: true;
    auth: IAuth;
    host: string;
    port: number;
    userAgent: string;
    packer?: Packer;
    unpacker?: Unpacker;
}

export const DEFAULT_PARAMS: IConnectionParams = {
    auth: {
        scheme: 'basic',
        principal: 'neo4j',
        credentials: 'newpassword'
    },
    host: 'localhost',
    port: 7687,
    // @ts-ignore
    userAgent: `tapestry/${'1.0.0'}`
};

export default class Connection {
    static VERSION = '1.0.0'; // @todo: dynamic

    protected readonly connectionParams: IConnectionParams;
    protected readonly socket: WebSocket;
    protected protocol: BOLT_PROTOCOLS = BOLT_PROTOCOLS.UNKNOWN;
    protected didAuth: boolean = false;
    protected incomingData = new ArrayBuffer(0);

    constructor(params: Partial<IConnectionParams>) {
        const connectionParams = merge({}, DEFAULT_PARAMS, params);

        this.connectionParams = connectionParams;

        this.socket = new WebSocket(
            `${connectionParams.secure ? 'wss' : 'ws'}://${connectionParams.host}:${connectionParams.port}`
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

    @autobind
    private onOpen() {
        this.socket.send(getHandshakeMessage());
    }

    @autobind
    private onClose(val: any) {
        console.log('onClose', val);
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
    }

    // @todo: better name
    @autobind
    private onChunk(view: DataView) {
        const unpacked = unpackResponseData(this.protocol, view, this.connectionParams.unpacker);

        console.log('onChunk', unpacked);
    }

    @autobind
    private onHandshake(data: DataView) {
        this.protocol = data.getInt32(0, false);

        this.socket.send(getAuthMessage(this.protocol, this.connectionParams, this.connectionParams.packer));
    }

    @autobind
    private onAuth(_: DataView) {
        this.didAuth = true;

        this.socket.send(getTestMessage(this.protocol, this.connectionParams.packer));
        this.socket.send(getRetrieveMessage(this.protocol, this.connectionParams.packer));
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
        console.error('onError', err);
    }
}
