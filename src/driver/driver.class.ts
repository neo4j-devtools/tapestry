import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {flatMap, map, skipWhile, take, takeWhile} from 'rxjs/operators';
import uuid from 'uuid/v4';
import {
    filter as _filter,
    forEach as _forEach,
    merge as _merge,
    some as _some
} from 'lodash';

import {IDriverConfig} from '../types';

import Connection from '../connection/connection.class';
import {DEFAULT_CONNECTION_CONFIG, DEFAULT_DRIVER_CONFIG, DRIVER_COMMANDS, DRIVER_HEADERS} from './driver.constants';
import {arrayHasItems} from '../utils/array.utils';

export interface IQuery {
    cmd: DRIVER_COMMANDS;
    data: any[];
}

export interface IRequest {
    id: string;
    queries: IQuery[];
}

export default class Driver<Data = any, Header = Data, Rec = any> {
    protected config: IDriverConfig<Data, Header, Rec>;
    protected connections: Connection<Data>[] = [];
    protected available: Connection<Data>[] = [];
    protected availableConnections: BehaviorSubject<Connection<Data>[]> = new BehaviorSubject<Connection<Data>[]>([]);
    protected requestQueue: Subject<IRequest> = new Subject();
    protected processing: Observable<[IRequest, Connection<Data>[]]> = this.requestQueue.pipe(
        flatMap((request) => this.availableConnections.pipe(
            map((connections): [IRequest, Connection<Data>[]] => [request, connections])
        ))
    );

    constructor(config: Partial<IDriverConfig<Data, Header, Rec>>) {
        this.config = _merge({}, DEFAULT_DRIVER_CONFIG, config);
    }

    runQuery(cypher: string, params: any = {}): Observable<Rec> {
        const requestID = uuid();

        setTimeout(() => {
            this.requestQueue.next({
                id: requestID,
                queries: [
                    {
                        cmd: DRIVER_COMMANDS.RUN,
                        data: [cypher, params]
                    },
                    {
                        cmd: DRIVER_COMMANDS.PULL_ALL,
                        data: []
                    }
                ]
            });
            this.getNextAvailableConnection();
        });

        return this.processing.pipe(
            skipWhile(([request, connections]) => request.id !== requestID || !arrayHasItems(connections)),
            take(1),
            flatMap(([request, connections]) => this.executeRequests(request, connections[0]))
        );
    }

    protected executeRequests(request: IRequest, connection: Connection<Data>): Observable<Rec> {
        this.occupyConnection(connection);
        console.log('exec', request.id);
        console.time(request.id);

        _forEach(request.queries, (query) => {
            connection.sendMessage(query.cmd, query.data);
        });

        let headerRecord: Header;

        return new Observable<Rec>((subscriber) => {
            let remaining = request.queries.length;

            connection.pipe(takeWhile(() => remaining !== 0)).subscribe({
                next: (message) => {
                    const {header, data} = message;

                    if (header === DRIVER_HEADERS.FAILURE) {
                        remaining = 0;

                        subscriber.error(data);
                        this.releaseConnection(connection);
                        console.timeEnd(request.id);

                        return;
                    }

                    if (header === DRIVER_HEADERS.SUCCESS) {
                        remaining -= 1;

                        // @todo: cleanup
                        headerRecord = this.config.mapToRecordHeader(data);
                    }

                    if (header === DRIVER_HEADERS.RECORD) {
                        // @todo: cleanup

                        subscriber.next(this.config.mapToRecord(
                            headerRecord,
                            data
                        ));
                    }

                    if (remaining === 0) {
                        console.log('complete', request.id);
                        console.timeEnd(request.id);
                        subscriber.complete();
                        this.releaseConnection(connection);
                    }
                },
                error: (err) => {
                    remaining = 0;

                    console.timeEnd(request.id);
                    subscriber.error(err);
                    this.terminateConnection(connection);
                }
            });
        });
    }

    protected addConnection() {
        const connectionParams = _merge({}, DEFAULT_CONNECTION_CONFIG, this.config.connectionConfig);
        const connection = new Connection<Data>(connectionParams);

        this.connections.push(connection);

        return connection;
    }

    protected occupyConnection(connection: Connection<Data>) {
        if (!_some(this.available, ({id}) => id === connection.id)) {
            return;
        }

        this.available = _filter(this.available, ({id}) => id !== connection.id);

        this.availableConnections.next(this.available);
    }

    protected releaseConnection(connection: Connection<Data>) {
        if (_some(this.available, ({id}) => id === connection.id)) {
            return;
        }

        this.available = [
            ...this.available,
            connection
        ];

        this.availableConnections.next(this.available);
    }

    protected getNextAvailableConnection() {
        if (arrayHasItems(this.available)) {
            return;
        }

        if (this.connections.length < this.config.maxPoolSize) {
            const connection = this.addConnection();

            this.connections = [
                ...this.connections,
                connection
            ];

            this.releaseConnection(connection);
            this.availableConnections.next(this.available);
        }
    }

    protected terminateConnection(connection: Connection<Data>) {
        this.occupyConnection(connection);

        this.connections = _filter(this.connections, ({id}) => id !== connection.id);

        connection.terminate();
    }
}
