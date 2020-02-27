import {forkJoin, Observable, of} from 'rxjs';
import {filter, flatMap, map, mapTo, reduce, switchMapTo, take, tap} from 'rxjs/operators';
import uuid from 'uuid/v4';
import {boundMethod} from 'autobind-decorator';
import _ from 'lodash';

import {
    IDiscoveryTable,
    IDriverConfig,
    IRequestMeta,
    ITransaction
} from '../types';
// only used internally
import {Bool, List, Result, Str} from '../monads';

import {
    DBMS_DB_STATUS,
    DBMS_DB_ROLE,
    DEFAULT_CONNECTION_CONFIG,
    DEFAULT_DRIVER_CONFIG,
    DRIVER_RESULT_TYPE,
    DRIVER_TRANSACTION_COMMANDS
} from './driver.constants';
import logger from '../utils/logger';
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
    transaction<Res = Rec>(meta: IRequestMeta = {}): Observable<TransactionDriver<Res>> {
        return this.readySubject.pipe(
            flatMap(() => this.waitForConnection([], meta)),
            flatMap(([, connection]) => this.beginTransaction(connection, meta)),
            map(([transactionData, connection]) => this.createTransactionDriver<Res>(transactionData, connection)),
            take(1) // force complete
        );
    };

    @boundMethod
    shutDown(): Observable<this> {
        if (this.isShutDown) {
            return of(this);
        }

        return of(this).pipe(
            tap(() => {
                if (this.discoveryPoll) {
                    clearInterval(this.discoveryPoll);

                    this.discoveryPoll = null;
                }

                this.connections = [];
                this.isShutDown = true;

                this.availableConnections.next([]);
            }),
            switchMapTo(forkJoin(_.map(this.connections, (con) => con.terminate()))),
            mapTo(this)
        );
    };

    @boundMethod
    private beginTransaction(connection: Connection, meta: IRequestMeta = {}): Observable<[ITransaction, Connection]> {
        const {db} = meta;
        const sessionId = uuid();

        return connection.sendMessage({
            cmd: DRIVER_TRANSACTION_COMMANDS.BEGIN,
            data: [],
            additionalData: (protocol) => {
                if (protocol < BOLT_PROTOCOLS.V3) {
                    return [];
                }

                return db && protocol > BOLT_PROTOCOLS.V3
                    ? [{db}]
                    : [{}];
            }
        }).pipe(
            mapTo([{sessionId, meta}, connection])
        );
    }

    @boundMethod
    private createTransactionDriver<Res = Rec>(transactionData: ITransaction, initialConnection: Connection) {
        const {meta, ...rest} = transactionData;
        const isSession = initialConnection.protocol >= 10; // @todo: which protocol version for sessionId
        const sane: ITransaction = isSession
            ? {...rest, meta: {...meta, address: initialConnection.address}}
            : {...rest, meta: _.omit(meta, 'address')};
        const parentConnections = this.connectionSubject.pipe(
            map((cons) => isSession
                ? _.filter(cons, ({address}) => address === initialConnection.address)
                : _.filter(cons, ({id}) => id === initialConnection.id)
            )
        );
        const onComplete = <Res>(cmd: DRIVER_TRANSACTION_COMMANDS, data: ITransaction): Observable<Res> => {
            const {sessionId, meta} = data;
            const messages = [
                isSession
                    ? {
                        cmd,
                        data: [{sessionId}],
                    }
                    : {
                        cmd,
                        data: [{}]
                    }
            ];
            const finale = isSession
                ? this.sendMessages<Res>(messages, _.pick(meta, 'address'))
                : this.executeRequests<Res>({id: uuid(), messages}, initialConnection);

            return finale.pipe(
                take(1) // @todo: just the first?
            );
        };

        return new TransactionDriver<Res>(
            sane,
            parentConnections,
            this,
            this.config,
            onComplete
        );
    }

    @boundMethod
    private runDiscovery() {
        // use our default type system for this call
        const routingConfig: IDriverConfig = _.merge(
            {},
            DEFAULT_DRIVER_CONFIG,
            _.omit(this.config, ['mapToResultHeader', 'mapToResult']),
            {
                useRouting: false,
                maxPoolSize: 1
            },
            {
                connectionConfig: _.merge(
                    _.omit(this.connectionConfig, ['packer', 'unpacker']),
                    _.pick(DEFAULT_CONNECTION_CONFIG, ['getResponseHeader', 'getResponseData']),
                )
            }
        );
        const routingDriver = new Driver(routingConfig);
        // 4.X only for now
        const result = routingDriver.query('SHOW DATABASES', {}, {db: 'system'}).pipe(
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
                        ? Str.of(DBMS_DB_ROLE.FOLLOWER)
                        : Str.of(DBMS_DB_ROLE.LEADER)
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

                return routingDriver.shutDown().toPromise();
            })
            .catch((err) => {
                logger(['Failed to perform discovery', err], 'error');

                return Promise.all([
                    this.shutDown().toPromise(),
                    routingDriver.shutDown().toPromise()
                ]);
            });
    }
}
