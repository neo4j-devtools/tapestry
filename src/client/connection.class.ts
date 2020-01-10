import {has, merge} from 'lodash';
import autobind from 'autobind-decorator';
import net, {Socket} from 'net';

import {packRequestData} from './packer';
import {unpackResponseMessage} from './unpacker';

// @todo: cleanup
if (!has(global, 'WebSocket')) {
    //@ts-ignore
    global['WebSocket'] = require('ws');
}

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
    userAgent: `js2neo/${'2'}`
};

export default class Connection {
    static VERSION = '1.0.0'; // @todo: dynamic

    protected readonly connectionParams: IConnectionParams;
    protected readonly socket: Socket;
    protected protocol: number = -1;
    protected didAuth: boolean = false;

    constructor(params: Partial<IConnectionParams>) {
        const connectionParams = merge({}, DEFAULT_PARAMS, params);

        this.connectionParams = connectionParams;

        this.socket = net.connect(
            connectionParams.port,
            connectionParams.host,
        );
        this.socket.setKeepAlive(true);

        this.socket.on('connect', this.onOpen);
        this.socket.on('data', this.onMessage);
        this.socket.on('error', this.onError);
        this.socket.on('close', this.onClose);
    }

    private get didHandshake() {
        return this.protocol !== -1;
    }

    private get isReady() {
        return this.didHandshake && this.didAuth;
    }

    @autobind
    private onOpen() {
        this.socket.write(getHandshakeMessage());
    }

    @autobind
    private onClose(val: any) {
        console.log('onClose', val);
    }

    @autobind
    private onData(data: DataView) {
        const unpacked = unpackResponseMessage(data);

        console.log('onData', unpacked);
    }

    @autobind
    private onHandshake(data: DataView) {
        this.protocol = data.getInt32(0, false);

        this.socket.write(getAuthMessage(this.protocol, this.connectionParams));
        this.socket.write(new Uint8Array([0,0]));
    }

    @autobind
    private onAuth(data: DataView) {
        console.log('onAuth', data);

        this.didAuth = true;

        this.socket.write(getTestMessage(this.protocol));
        this.socket.write(new Uint8Array([0,0]));
    }

    @autobind
    private onMessage(event: Buffer) {
        // @todo: expensive op?
        const data = new DataView(new Uint8Array(event).buffer);

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

function getHandshakeMessage() {
    return new Uint8Array([
        0x60, 0x60, 0xB0, 0x17,
        0x00, 0x00, 0x00, 0x02,
        0x00, 0x00, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00
    ]);
}

function getAuthMessage(protocol: number, params: IConnectionParams) {
    const data = [
        ...packRequestData(params.userAgent),
        ...packRequestData(params.auth)
    ];

    switch (protocol) {
        default:
            return new Uint8Array([
                (data.length + 2) >> 8,
                (data.length + 2) & 0xFF,
                0xB0 + 2,
                0x01,
                ...data
            ]);
    }
}

function getTestMessage(protocol: number) {
    const data = [
        ...packRequestData('RETURN 1')
    ];

    switch (protocol) {
        default:
            return new Uint8Array([
                (data.length + 2) >> 8,
                (data.length + 2) & 0xFF,
                0xB0 + 1,
                0x10,
                ...data
            ]);
    }
}
