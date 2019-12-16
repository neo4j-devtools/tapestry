import {Observable, Subscriber} from 'rxjs';
import uuid from 'uuid/v4';
import autobind from 'autobind-decorator';
import net from 'net'

import {StreamConfig, StreamMessage} from './stream.types';
import {SaneQuery} from '../connection/connection.types';

import Connection from '../connection/connection.class';

export default class Stream extends Observable<StreamMessage> {
    public readonly streamId = uuid();
    public readonly streamConfig: StreamConfig;
    private readonly streamSocket: net.Socket;

    static makeConfig(connection: Connection): StreamConfig {
        return {}
    }

    static makeSocket(connection: Connection) {
        const socket = net.connect(
            7697,
            '127.0.0.1',
            () => {
                console.log
            }
        );

        socket.setKeepAlive(true);

        return socket;
    }

    constructor(private readonly connection: Connection, private readonly query: SaneQuery) {
        super();
        this.streamConfig = Stream.makeConfig(connection);
        this.streamSocket = Stream.makeSocket(connection);
        this._subscribe = this.streamObserver; // (ಥ﹏ಥ)
    }

    @autobind
    private streamObserver(subscriber: Subscriber<StreamMessage>) {

    }
}
