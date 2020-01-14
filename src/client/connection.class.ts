import {merge} from 'lodash';
import autobind from 'autobind-decorator';

import {packRequestData} from './packer';
import {unpackResponseMessage} from './unpacker';
import {getAuthMessage, getHandshakeMessage, joinArrayBuffers} from './connection.utils';
import {V1_BOLT_MESSAGES} from './connection.constants';

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
    protected protocol: number = -1;
    protected didAuth: boolean = false;
    protected incomingData = new ArrayBuffer(0);

    constructor(params: Partial<IConnectionParams>) {
        const connectionParams = merge({}, DEFAULT_PARAMS, params);

        this.connectionParams = connectionParams;

        this.socket = new WebSocket(
            `${connectionParams.secure ? 'wss': 'ws'}://${connectionParams.host}:${connectionParams.port}`
        );
        this.socket.binaryType = 'arraybuffer';
        this.socket.onopen = this.onOpen;
        this.socket.onmessage = this.onMessage;
        this.socket.onerror = this.onError;
        this.socket.onclose = this.onClose;
    }

    private get didHandshake() {
        return this.protocol !== -1;
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
        const unpacked = unpackResponseMessage(view);

        console.log('onChunk', unpacked);
    }

    @autobind
    private onHandshake(data: DataView) {
        this.protocol = data.getInt32(0, false);

        this.socket.send(getAuthMessage(this.protocol, this.connectionParams));
    }

    @autobind
    private onAuth(_: DataView) {
        this.didAuth = true;

        this.socket.send(getTestMessage(this.protocol));
        this.socket.send(getRetrieveMessage(this.protocol));
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

function getTestMessage(protocol: number) {
    const noFields = 2;
    const data = [
        0xB0 + noFields,
        V1_BOLT_MESSAGES.RUN,
        ...packRequestData('MATCH p=()-[r:LOVES]->() RETURN p'),
        ...packRequestData({})
    ];
    const chunkSize = data.length;

    switch (protocol) {
        default:
            return new Uint8Array([
                chunkSize >> 8,
                chunkSize & 0xFF,
                ...data,
                0,
                0
            ]);
    }
}

// @ts-ignore
function getRetrieveMessage(protocol: number) {
    const noFields = 0;
    const data: number[] = [
        0xB0 + noFields,
        V1_BOLT_MESSAGES.PULL_ALL
    ];
    const chunkSize = data.length;

    switch (protocol) {
        default:
            return new Uint8Array([
                chunkSize >> 8,
                chunkSize & 0xFF,
                ...data,
                0,
                0
            ]);
    }
}

