import {AsyncSubject, BehaviorSubject, Observable, Subject} from 'rxjs';
import {flatMap, map, skipWhile, take, takeWhile, tap} from 'rxjs/operators';
import uuid from 'uuid/v4';
import {boundMethod} from 'autobind-decorator';
import _ from 'lodash';

import {
    IClientMessage,
    IConnectionConfig,
    IDBMSMember,
    IDiscoveryTable,
    IDriverConfig,
    IQueryMeta,
    IRequest,
    IRequestMeta
} from '../types';

import {
    DEFAULT_CONNECTION_CONFIG,
    DRIVER_HEADERS,
    DRIVER_QUERY_COMMANDS,
    DRIVER_RESULT_TYPE,
} from './driver.constants';
import {arrayHasItems} from '../utils/array.utils';
import {BOLT_PROTOCOLS, Connection} from '../connection';
import {InvalidOperationError} from '../errors';
import {determineConnectionHosts} from './driver.utils';

export default abstract class DriverBase<Rec = any> {
    protected isReady = false;
    protected isShutDown = false;
    protected isSlave = false;
    protected discoveryTables: IDiscoveryTable[] = [];
    protected connections: Connection[] = [];
    protected available: Connection[] = [];
    protected readonly connectionConfig: IConnectionConfig;
    protected readonly connectionSubject: BehaviorSubject<Connection[]> = new BehaviorSubject<Connection[]>([]);
    protected readonly readySubject = new AsyncSubject<void>();
    protected readonly availableConnections: BehaviorSubject<Connection[]> = new BehaviorSubject<Connection[]>([]);
    protected readonly requestQueue: Subject<IRequest> = new Subject();
    protected readonly processing: Observable<[IRequest, Connection]> = this.requestQueue.pipe(
        flatMap((request) => this.requestAvailableConnection(request.meta).pipe(
            map((connections): [IRequest, Connection] => [request, connections[0]])
        )),
    );

    constructor(protected readonly config: IDriverConfig) {
        this.connectionConfig = _.merge({}, DEFAULT_CONNECTION_CONFIG, this.config.connectionConfig);

        // @boundMethod does not like inheritance
        this.query = this.query.bind(this);

        if (!this.config.useRouting) {
            this.isReady = true;

            // signal ready to send messages
            this.readySubject.next();
            this.readySubject.complete();
        }
    }

    // @boundMethod does not like inheritance
    query<Res = Rec>(cypher: string, params: any = {}, meta: IQueryMeta = {}): Observable<Res> {
        const {pullN = -1, db} = meta; // @todo: transaction session ID

        return this.sendMessages<Res>(
            [
                {
                    cmd: DRIVER_QUERY_COMMANDS.RUN,
                    data: [cypher, params],
                    additionalData: (protocol) => {
                        if (protocol < BOLT_PROTOCOLS.V3) {
                            return [];
                        }

                        return db && protocol > BOLT_PROTOCOLS.V3
                            ? [{db}]
                            : [{}];
                    }
                },
                {
                    cmd: DRIVER_QUERY_COMMANDS.PULL,
                    data: [],
                    additionalData: (protocol) => protocol >= BOLT_PROTOCOLS.V4
                        ? [{n: pullN}]
                        : []
                }
            ],
            meta
        );
    }

    transaction<Res = Rec>(_: IRequestMeta = {}): Observable<DriverBase<Res>> {
        throw new InvalidOperationError('Transaction pending');
    };

    commit<Res = Rec>(): Observable<Res> {
        throw new InvalidOperationError('No transaction pending');
    }

    rollback<Res = Rec>(): Observable<Res> {
        throw new InvalidOperationError('No transaction pending');
    }

    abstract shutDown(): Observable<this>;

    @boundMethod
    protected sendMessages<Res>(messages: IClientMessage[] = [], meta?: IRequestMeta): Observable<Res> {
        return this.readySubject.pipe(
            flatMap(() => this.waitForConnection(messages, meta)),
            flatMap(([request, connection]) => this.executeRequests<Res>(request, connection))
        );
    }

    @boundMethod
    protected waitForConnection(messages: IClientMessage[], meta?: IRequestMeta): Observable<[IRequest, Connection]> {
        if (this.isShutDown) {
            throw new InvalidOperationError('Driver is shut down');
        }

        const requestID = uuid();

        // @todo: actually handle this properly
        setTimeout(() => {
            this.requestQueue.next({
                id: requestID,
                messages,
                meta,
            });
        });

        return this.processing.pipe(
            skipWhile(([request]) => request.id !== requestID),
            take(1),
            tap(([, connection]) => this.occupyConnection(connection)),
        );
    }

    @boundMethod
    protected executeRequests<Res>(request: IRequest, connection: Connection): Observable<Res> {
        console.log('exec', request.id);
        console.time(request.id);

        _.forEach(request.messages, (query) => {
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
    protected addConnection(dbmsHost: IDBMSMember): Connection {
        const config = _.merge({}, this.connectionConfig, {
            host: dbmsHost.host,
            port: dbmsHost.port
        });
        const connection = this.createConnection(config);

        connection.subscribe({
            complete: () => this.terminateConnection(connection),
            error: () => this.terminateConnection(connection),
        });

        return connection;
    }

    @boundMethod
    protected createConnection(config: IConnectionConfig): Connection {
        return new Connection(config);
    }

    @boundMethod
    protected occupyConnection(connection: Connection): Connection {
        if (!_.some(this.available, ({id}) => id === connection.id)) {
            return connection;
        }

        this.available = _.filter(this.available, ({id}) => id !== connection.id);

        this.availableConnections.next(this.available);

        return connection;
    }

    @boundMethod
    protected releaseConnection(connection: Connection): Connection {
        if (!_.some(this.connections, ({id}) => id === connection.id)) {
            return connection;
        }

        if (_.some(this.available, ({id}) => id === connection.id)) {
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
    protected requestAvailableConnection(meta?: IRequestMeta): Observable<Connection[]> {
        const dbmsHosts = determineConnectionHosts(
            this.connectionConfig,
            this.discoveryTables,
            this.connections,
            meta
        );
        const connectionPredicate = ({address}: Connection) => {
            return _.some(dbmsHosts, (host) => address === host.address);
        };

        if (!arrayHasItems(dbmsHosts)) {
            throw new InvalidOperationError(`Unable to find a valid connection host`);
        }

        const validAvailable = _.filter(this.available, connectionPredicate);

        if (this.isSlave || arrayHasItems(validAvailable)) {
            return this.availableConnections;
        }

        if (this.connections.length < this.config.maxPoolSize) {
            const connection = this.addConnection(dbmsHosts[0]);

            this.connections = [
                ...this.connections,
                connection
            ];

            this.releaseConnection(connection);
            this.connectionSubject.next(this.connections);
            this.availableConnections.next(this.available);
        }

        return this.availableConnections.pipe(
            skipWhile((connections) => !_.some(connections, connectionPredicate))
        );
    }

    @boundMethod
    protected terminateConnection(connection: Connection): Promise<Connection> {
        this.occupyConnection(connection);

        this.connections = _.filter(this.connections, ({id}) => id !== connection.id);
        this.connectionSubject.next(this.connections);

        return connection.terminate();
    }
}
