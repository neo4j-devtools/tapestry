import {BehaviorSubject, forkJoin, Observable, of, Subject} from 'rxjs';
import {flatMap, map, mapTo, skipWhile, take, takeWhile, tap} from 'rxjs/operators';
import uuid from 'uuid/v4';
import {boundMethod} from 'autobind-decorator';
import {filter as _filter, forEach as _forEach, map as _map, merge as _merge, some as _some} from 'lodash';

import {IClientMessage, IDriverConfig, IRequest, IRunQueryMeta} from '../types';

import {
    DEFAULT_CONNECTION_CONFIG,
    DEFAULT_DRIVER_CONFIG,
    DRIVER_HEADERS,
    DRIVER_QUERY_COMMANDS,
    DRIVER_RESULT_TYPE,
    DRIVER_TRANSACTION_COMMANDS
} from './driver.constants';
import {arrayHasItems} from '../utils/array.utils';
import {BOLT_PROTOCOLS, Connection} from '../connection';
import {InvalidOperationError} from '../errors';

export default class Driver<Rec = any> {
    protected config: IDriverConfig;
    protected connections: Connection[] = [];
    protected available: Connection[] = [];
    protected availableConnections: BehaviorSubject<Connection[]> = new BehaviorSubject<Connection[]>([]);
    protected requestQueue: Subject<IRequest> = new Subject();
    protected processing: Observable<[IRequest, Connection[]]> = this.requestQueue.pipe(
        flatMap((request) => this.availableConnections.pipe(
            map((connections): [IRequest, Connection[]] => [request, connections])
        ))
    );
    protected isShutDown = false;

    constructor(config: Partial<IDriverConfig>) {
        this.config = _merge({}, DEFAULT_DRIVER_CONFIG, config);
    }

    @boundMethod
    query<Res = Rec>(cypher: string, params: any = {}, meta: IRunQueryMeta = {}): Observable<Res> {
        const {pullN = -1} = meta;

        return this.sendMessages<Res>([
            {
                cmd: DRIVER_QUERY_COMMANDS.RUN,
                data: [cypher, params, {}],
                additionalData: (protocol) => protocol >= BOLT_PROTOCOLS.V3
                    ? [{}]
                    : []
            },
            {
                cmd: DRIVER_QUERY_COMMANDS.PULL,
                data: [],
                additionalData: (protocol) => protocol >= BOLT_PROTOCOLS.V4
                    ? [{n: pullN}]
                    : []
            }
        ]);
    }

    // @boundMethod directive freaks out on inherited props
    transaction = <Res = Rec>(): Observable<BoundDriver<Res>> => {
        return this.getConnectionForRequest().pipe(
            flatMap(([, connection]) => this.beginTransaction(connection)),
            map((connection) => new BoundDriver(connection, this.config, this.releaseConnection)),
            take(1) // force complete
        );
    };

    commit() {
        throw new InvalidOperationError('No transaction pending');
    }

    rollback() {
        throw new InvalidOperationError('No transaction pending');
    }

    // @boundMethod directive freaks out on inherited props
    shutDown = (): Promise<this> => {
        if (this.isShutDown) {
            return Promise.resolve(this);
        }

        const {connections} = this;

        this.connections = [];
        this.isShutDown = true;

        this.availableConnections.next([]);

        return forkJoin(_map(connections, (con) => con.terminate())).pipe(
            mapTo(this)
        ).toPromise();
    };

    @boundMethod
    protected sendMessages<Res>(messages: IClientMessage[] = []): Observable<Res> {
        return this.getConnectionForRequest(messages).pipe(
            flatMap(([request, connection]) => this.executeRequests<Res>(request, connection))
        );
    }

    @boundMethod
    protected getConnectionForRequest(messages: IClientMessage[] = []): Observable<[IRequest, Connection]> {
        if (this.isShutDown) {
            throw new InvalidOperationError('Driver is shut down');
        }

        const requestID = uuid();

        // @todo: actually handle this properly
        setTimeout(() => {
            this.requestQueue.next({
                id: requestID,
                messages,
            });
            this.requestAvailableConnection();
        });

        return this.processing.pipe(
            skipWhile(([request, connections]) => request.id !== requestID || !arrayHasItems(connections)),
            take(1),
            map(([request, connections]): [IRequest, Connection] => [request, connections[0]]),
            tap(([, connection]) => this.occupyConnection(connection)),
        );

    }

    @boundMethod
    protected executeRequests<Res>(request: IRequest, connection: Connection): Observable<Res> {
        console.log('exec', request.id);
        console.time(request.id);

        _forEach(request.messages, (query) => {
            connection.sendMessage(query).toPromise();
        });

        let headerRecord: any;

        return new Observable<Res>((subscriber) => {
            let remaining = request.messages.length;

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

                    if (headerRecord && header === DRIVER_HEADERS.SUCCESS) {
                        remaining -= 1;

                        // @todo: cleanup
                        subscriber.next(this.config.mapToResult(
                            headerRecord,
                            DRIVER_RESULT_TYPE.SUMMARY,
                            data
                        ));
                    }

                    if (!headerRecord && header === DRIVER_HEADERS.SUCCESS) {
                        remaining -= 1;

                        // @todo: cleanup
                        headerRecord = this.config.mapToResultHeader(data);
                    }

                    if (header === DRIVER_HEADERS.RECORD) {
                        // @todo: cleanup
                        subscriber.next(this.config.mapToResult(
                            headerRecord,
                            DRIVER_RESULT_TYPE.RECORD,
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
                }
            });
        });
    }

    @boundMethod
    protected addConnection() {
        const connectionParams = _merge({}, DEFAULT_CONNECTION_CONFIG, this.config.connectionConfig);
        const connection = new Connection(connectionParams);

        this.connections.push(connection);

        connection.subscribe({
            complete: () => this.terminateConnection(connection),
            error: () => this.terminateConnection(connection),
        });

        return connection;
    }

    @boundMethod
    protected occupyConnection(connection: Connection): Connection {
        if (!_some(this.available, ({id}) => id === connection.id)) {
            return connection;
        }

        this.available = _filter(this.available, ({id}) => id !== connection.id);

        this.availableConnections.next(this.available);

        return connection;
    }

    @boundMethod
    protected releaseConnection(connection: Connection): Connection {
        if (!_some(this.connections, ({id}) => id === connection.id)) {
            return connection;
        }

        if (_some(this.available, ({id}) => id === connection.id)) {
            return connection;
        }

        this.available = [
            ...this.available,
            connection
        ];

        this.availableConnections.next(this.available);

        return connection;
    }

    @boundMethod
    protected requestAvailableConnection() {
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

    @boundMethod
    protected terminateConnection(connection: Connection): Promise<Connection> {
        this.occupyConnection(connection);

        this.connections = _filter(this.connections, ({id}) => id !== connection.id);

        return connection.terminate();
    }

    private beginTransaction(connection: Connection) {
        return connection.sendMessage({
            cmd: DRIVER_TRANSACTION_COMMANDS.BEGIN,
            data: [],
            additionalData: (protocol) => protocol >= BOLT_PROTOCOLS.V3
                ? [{}]
                : []
        }).pipe(
            mapTo(connection)
        );
    }
}

type TransactionCallback = (connection: Connection) => Connection;

export class BoundDriver<Rec = any> extends Driver<Rec> {
    constructor(connection: Connection, config: IDriverConfig, onComplete: TransactionCallback) {
        const boundConfig: IDriverConfig = {
            ...config,
            maxPoolSize: 1,
        };

        super(boundConfig);

        this.connections.push(connection);
        this.releaseConnection(connection);

        // @boundMethod directive freaks out on inherited props
        this.transaction = (): Observable<BoundDriver> => {
            throw new InvalidOperationError('Transaction pending');
        };

        // @boundMethod directive freaks out on inherited props
        this.shutDown = () => {
            if (this.isShutDown) {
                return Promise.resolve(this);
            }

            this.isShutDown = true;

            return of(_map(this.connections, onComplete)).pipe(
                mapTo(this)
            ).toPromise();
        };

        connection.subscribe({
            complete: this.shutDown,
            error: this.shutDown
        });
    }

    @boundMethod
    commit<Res = Rec>(): Observable<Res> {
        return this.sendMessages<Res>([
            {
                cmd: DRIVER_TRANSACTION_COMMANDS.COMMIT,
                data: [{}]
            },
        ]).pipe(
            tap(this.shutDown)
        );
    }

    @boundMethod
    rollback<Res = Rec>(): Observable<Res> {
        return this.sendMessages<Res>([
            {
                cmd: DRIVER_TRANSACTION_COMMANDS.ROLLBACK,
                data: [{}]
            },
        ]).pipe(
            tap(this.shutDown)
        );
    }
}
