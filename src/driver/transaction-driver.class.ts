import {Observable, of, Subscription} from 'rxjs';
import {boundMethod} from 'autobind-decorator';
import _ from 'lodash';

import {IDriverConfig, IQueryMeta, ITransaction} from '../types';

import {DRIVER_TRANSACTION_COMMANDS} from './driver.constants';
import {Connection} from '../connection';
import DriverBase from './driver.abstract';
import {tap} from 'rxjs/operators';

type TransactionCallback = <Res = any>(cmd: DRIVER_TRANSACTION_COMMANDS, transaction: ITransaction) => Observable<Res>;

export default class TransactionDriver<Rec = any> extends DriverBase<Rec> {
    private readonly transactionData: ITransaction;
    private readonly onComplete: TransactionCallback;
    private readonly parentDriver: DriverBase<Rec>;
    private readonly parentSubscription: Subscription;

    private get isSession() {
        return _.has(this.transactionData, 'meta.address');
    }

    constructor(transactionData: ITransaction, connections: Observable<Connection[]>, parent: DriverBase<Rec>, config: IDriverConfig, onComplete: TransactionCallback) {
        const boundConfig: IDriverConfig = {
            ...config,
            useRouting: false
        };

        super(boundConfig);

        this.parentDriver = parent;
        this.onComplete = onComplete;
        this.isSlave = true;
        this.transactionData = transactionData;

        this.parentSubscription = connections.subscribe({
            next: (conns) => {
                const newConnections = _.filter(conns, (c) => !_.some(this.connections, ({id}) => c.id === id));
                this.connections = conns;

                _.forEach(newConnections, this.releaseConnection);
            },
            error: this.shutDown
        });
    }

    // @boundMethod does not like inheritance
    query<Res = Rec>(cypher: string, params: any = {}, meta: IQueryMeta = {}): Observable<Res> {
        if (this.isSession) {
            const combinedMeta = _.assign({}, meta, _.omit(this.transactionData, 'meta'));

            return this.parentDriver.query(cypher, params, combinedMeta);
        }

        return super.query(cypher, params, meta);
    }

    @boundMethod
    shutDown(): Observable<this> {
        if (this.isShutDown) {
            return of(this);
        }

        return of(this).pipe(
            tap(() => {
                this.isShutDown = true;
                this.parentSubscription.unsubscribe();
            })
        );
    };

    @boundMethod
    commit<Res = Rec>(): Observable<Res> {
        return this.onComplete<Res>(DRIVER_TRANSACTION_COMMANDS.COMMIT, this.transactionData).pipe(
            tap(this.shutDown)
        );
    }

    @boundMethod
    rollback<Res = Rec>(): Observable<Res> {
        return this.onComplete<Res>(DRIVER_TRANSACTION_COMMANDS.ROLLBACK, this.transactionData).pipe(
            tap(this.shutDown)
        );
    }
}
