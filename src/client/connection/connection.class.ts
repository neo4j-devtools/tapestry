import {Observable, Subscriber} from 'rxjs';
import uuid from 'uuid/v4';
import net from 'net';
import autobind from 'autobind-decorator';

import {ConnectionConfig} from './connection.types'; // @todo: socket typing

import Pool from '../pool/pool.class';
import RequestMessage from '../request-message/request-message.class';

export default class Connection extends Observable<Buffer> {
    public readonly connectionId = uuid();
    public readonly connectionConfig: ConnectionConfig;
    private readonly connectionSocket: net.Socket;

    static makeConfig(pool: Pool) {
        return {};
    }

    static makeSocket(pool: Pool) {
        const socket = net.connect(
            7697,
            '127.0.0.1',
            () => {
                console.log;
            }
        );

        socket.setKeepAlive(true);

        return socket;
    }

    constructor(private readonly pool: Pool) {
        super();
        this.connectionConfig = Connection.makeConfig(pool);
        this.connectionSocket = Connection.makeSocket(pool);
        this._subscribe = this.connectionObserver; // (ಥ﹏ಥ)
    }



    sendMessage(message: RequestMessage) {
        this.connectionSocket.write(message);

        return this;
    }

    private healthCheck() {
        if (this.connectionSocket.readable && this.connectionSocket.writable) return true;

        // @todo: logging, race conditions, all that jazz
        this.connectionSocket.end(() => {
            this.pool.destroyConnection(this);
        });

        return false;
    }

    @autobind
    private connectionObserver(subscriber: Subscriber<any>) {
        this.connectionSocket.on('data', subscriber.next);
        this.connectionSocket.on('error', subscriber.error);
        this.connectionSocket.on('end', subscriber.complete);
    }
}

