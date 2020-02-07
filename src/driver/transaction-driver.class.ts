import {Observable, of} from 'rxjs';
import {mapTo, tap} from 'rxjs/operators';
import {boundMethod} from 'autobind-decorator';
import _ from 'lodash';

import {IDriverConfig, IQueryMeta, ITransaction} from '../types';

import {DRIVER_TRANSACTION_COMMANDS} from './driver.constants';
import {Connection} from '../connection';
import DriverBase from './driver.abstract';

type TransactionCallback = (connection: Connection) => Connection;

export default class TransactionDriver<Rec = any> extends DriverBase<Rec> {
    // @ts-ignore
    private readonly transactionData: ITransaction;
    private readonly onComplete: TransactionCallback;

    constructor(transactionData: ITransaction, connections: Connection[], config: IDriverConfig, onComplete: TransactionCallback) {
        const boundConfig: IDriverConfig = {
            ...config,
            maxPoolSize: 1,
            useRouting: false
        };

        super(boundConfig);

        this.onComplete = onComplete;
        this.isBound = true;
        this.transactionData = transactionData;
        this.connections = connections;

        _.forEach(connections, this.releaseConnection);

        /* @todo: or already handled by lexical in addConnection?
        connections.subscribe({
            complete: this.shutDown,
            error: this.shutDown
        });
        */
    }

    query<Res = Rec>(cypher: string, params: any = {}, meta: IQueryMeta = {}): Observable<Res> {
        const combined = _.assign({}, meta, this.transactionData.meta);

        return super.query(cypher, params, combined);
    }

    @boundMethod
    shutDown(): Promise<this> {
        if (this.isShutDown) {
            return Promise.resolve(this);
        }

        this.isShutDown = true;

        return of(_.map(this.connections, this.onComplete)).pipe(
            mapTo(this)
        ).toPromise();
    };

    @boundMethod
    commit<Res = Rec>(): Observable<Res> {
        return this.sendMessages<Res>(
            [
                {
                    cmd: DRIVER_TRANSACTION_COMMANDS.COMMIT,
                    data: [{}] // @todo: sessionId
                },
            ],
            this.transactionData.meta
        ).pipe(
            tap(this.shutDown)
        );
    }

    @boundMethod
    rollback<Res = Rec>(): Observable<Res> {
        return this.sendMessages<Res>(
            [
                {
                    cmd: DRIVER_TRANSACTION_COMMANDS.ROLLBACK,
                    data: [{}] // @todo: sessionId
                },
            ],
            this.transactionData.meta
        ).pipe(
            tap(this.shutDown)
        );
    }
}
