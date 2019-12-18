import {Observable, Subject} from 'rxjs';
import {flatMap, map} from 'rxjs/operators';
import uuid from 'uuid/v4';
import net from 'net';
import autobind from 'autobind-decorator';

import {ConnectionConfig} from './connection.types';

import Pool from '../pool/pool.class';
import RequestMessage from '../request-message/request-message.class';
import {createHandshakeBuffer} from '../../utils/protocol.utils';
import Protocol from '../protocol/protocol.class';

export default class Connection extends Subject<RequestMessage> {
    public readonly connectionId = uuid();
    public readonly connectionConfig: ConnectionConfig;
    private readonly connectionSocket: net.Socket;
    private readonly connectionProtocol = new Protocol();

    static makeConfig() {
        return {};
    }

    static makeSocket() {
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

        this.connectionConfig = Connection.makeConfig();
        this.connectionSocket = Connection.makeSocket();

        this.negotiateProtocol();
    }

    private negotiateProtocol() {
        this.connectionSocket.write(createHandshakeBuffer());

        const protocolSetter = (data: Buffer) => {
            this.connectionProtocol.determineProtocolFromMessage(data);
            // this.connectionProtocol.complete(); // @todo: not sure?
            this.applyConnectionObservers();
            this.connectionSocket.off('data', protocolSetter);
        };

        this.connectionSocket.on('data', protocolSetter);
    }

    sendMessage(message: RequestMessage) {
        return this.connectionProtocol.pipe(
            flatMap((connectionProtocol) => {
                this.connectionSocket.write(connectionProtocol.toBuffer(message));

                return this;
            })
        );
    }

    receiveMessage(message: Buffer): Observable<RequestMessage> {
        return this.connectionProtocol.pipe(
            map((connectionProtocol) => connectionProtocol.fromBuffer(message))
        );
    }

    private destroy() {
        this.pool.destroyConnection(this);
    }

    @autobind
    private applyConnectionObservers() {
        // @todo: on("connect")?
        this.connectionSocket.on('data', (message) => {
            this.receiveMessage(message).subscribe((message) => this.next(message));
        });
        this.connectionSocket.on('error', (error) => {
            this.error(error);
            this.destroy();
        });
        this.connectionSocket.on('end', () => {
            this.complete();
            this.destroy();
        });
    }
}

