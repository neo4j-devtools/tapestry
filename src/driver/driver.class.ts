import {forkJoin, Observable} from 'rxjs';
import {filter, flatMap, map, mapTo, reduce, take} from 'rxjs/operators';
import uuid from 'uuid/v4';
import {boundMethod} from 'autobind-decorator';
import _ from 'lodash';

import {IBaseMeta, IConnectionConfig, IDiscoveryTable, IDriverConfig, IRequest, ITransactionMeta} from '../types';
// only used internally
import {Bool, List, Result, Str} from '../monads';

import {
    DBMS_DB_STATUS,
    DBMS_MEMBER_ROLE,
    DEFAULT_CONNECTION_CONFIG,
    DEFAULT_DRIVER_CONFIG,
    DRIVER_QUERY_COMMANDS,
    DRIVER_RESULT_TYPE,
    DRIVER_TRANSACTION_COMMANDS
} from './driver.constants';
import {BOLT_PROTOCOLS, Connection} from '../connection';
import DriverBase from './driver.abstract';
import TransactionDriver from './transaction-driver.class';

export default class Driver<Rec = any> extends DriverBase<Rec> {
    private discoveryPoll: NodeJS.Timeout | null = null;

    constructor(config: Partial<IDriverConfig>) {
        super(_.merge({}, DEFAULT_DRIVER_CONFIG, config));

        if (this.config.useRouting) {
            this.runDiscovery();

            this.discoveryPoll = setInterval(this.runDiscovery, this.config.discoveryIntervalMs);
        }
    }

    @boundMethod
    transaction<Res = Rec>(meta: IBaseMeta = {}): Observable<TransactionDriver<Res>> {
        return this.getConnectionForRequest().pipe(
            flatMap(([, connection]) => this.beginTransaction(connection, meta)),
            // @todo: for all connections on same member
            map(([meta, connection]) => new TransactionDriver(meta, [connection], this.config, this.releaseConnection)),
            take(1) // force complete
        );
    };

    @boundMethod
    shutDown(): Promise<this> {
        if (this.isShutDown) {
            return Promise.resolve(this);
        }

        if (this.discoveryPoll) {
            clearInterval(this.discoveryPoll);

            this.discoveryPoll = null;
        }

        const {connections} = this;

        this.connections = [];
        this.isShutDown = true;

        this.availableConnections.next([]);

        return forkJoin(_.map(connections, (con) => con.terminate())).pipe(
            mapTo(this)
        ).toPromise();
    };

    private beginTransaction(connection: Connection, meta: IBaseMeta = {}): Observable<[ITransactionMeta, Connection]> {
        const {db} = meta;

        return connection.sendMessage({
            cmd: DRIVER_TRANSACTION_COMMANDS.BEGIN,
            data: [],
            additionalData: (protocol) => {
                if (protocol < BOLT_PROTOCOLS.V3) {
                    return []
                }

                return db && protocol > BOLT_PROTOCOLS.V3
                    ? [{db}]
                    : [{}];
            }
        }).pipe(
            mapTo([{sessionId: uuid()}, connection])
        );
    }

    @boundMethod
    private runDiscovery() {
        // use our default type system for this call
        const routingConfig: IConnectionConfig = _.merge(
            _.omit(this.connectionConfig, ['packer', 'unpacker']),
            _.pick(DEFAULT_CONNECTION_CONFIG, ['getResponseHeader', 'getResponseData']),
        );
        const routingConnection = this.createConnection(routingConfig);

        // 4.X only for now
        const routingRequest: IRequest = {
            id: uuid(),
            messages: [
                {
                    cmd: DRIVER_QUERY_COMMANDS.RUN,
                    data: ['SHOW DATABASES', {}, {db: 'system'}]
                },
                {
                    cmd: DRIVER_QUERY_COMMANDS.PULL,
                    data: [{n: -1}]
                }
            ]
        };

        const result = this.executeRequests<Result>(routingRequest, routingConnection).pipe(
            filter(({type}) => type === DRIVER_RESULT_TYPE.RECORD),
            reduce((agg, next) => agg.concat(next), List.of<Result>([])),
            map((results) => results.reduce<IDiscoveryTable[]>((agg, next) => [
                ...agg,
                {
                    name: next.getFieldData('name').getOrElse(Str.EMPTY),
                    address: next.getFieldData('address').getOrElse(Str.EMPTY),
                    currentStatus: next.getFieldData('currentStatus').flatMap((val) => val.equals(Str.of('online'))
                        ? Str.of(DBMS_DB_STATUS.ONLINE)
                        : Str.of(DBMS_DB_STATUS.OFFLINE)
                    ),
                    role: next.getFieldData('role').flatMap((val) => val.equals(Str.of('follower'))
                        ? Str.of(DBMS_MEMBER_ROLE.FOLLOWER)
                        : Str.of(DBMS_MEMBER_ROLE.LEADER)
                    ),
                    isDefault: next.getFieldData('default').getOrElse(Bool.FALSE),
                }
            ], []))
        ).toPromise();

        result
            .then((tables) => {
                this.discoveryTables = tables;

                if (this.isReady) {
                    return;
                }

                this.isReady = true;

                // signal ready to send messages
                this.readySubject.next();
                this.readySubject.complete();
            })
            .catch((err) => {
                console.log(`Failed to perform discovery: ${err}`);

                return this.shutDown();
            })
            .finally(routingConnection.terminate)
    }
}

