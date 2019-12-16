import {of, Subject} from 'rxjs';
import {flatMap, map, skipWhile, take, tap, withLatestFrom} from 'rxjs/operators';
import {filter as _filter, head as _head} from 'lodash-es';
import uuid from 'uuid/v4';

import {PoolConfig, SaneQuery} from '../connection/connection.types';

import Connection from '../connection/connection.class';
import Driver from '../driver/driver.class';
import {arrayHasItems, arrayAtOrAbove} from '../../utils/array.utils';

export default class Pool {
    public readonly poolId = uuid();
    public readonly poolConfig: PoolConfig;
    private readonly activeConnections = new Subject<Connection[]>();
    private readonly availableConnections = new Subject<Connection[]>();
    private requestQueue: SaneQuery[] = [];

    static makeConfig(driver: Driver): PoolConfig {
        // @todo
        return {
            members: []
        }
    }

    constructor(private readonly driver: Driver) {
        this.poolConfig = Pool.makeConfig(driver);
    }

    getNextAvailableConnection(query: SaneQuery) {
        return this.availableConnections.pipe(
            take(1),
            withLatestFrom(this.activeConnections),
            flatMap(([availableConnections, activeConnections]) => {
                if (!(arrayHasItems(availableConnections) && arrayAtOrAbove(activeConnections, this.driver.driverConfig.maxConcurrentConnections))) {
                    const newConnection = new Connection(this);

                    this.activeConnections.next([
                        ...activeConnections,
                        newConnection
                    ]);

                    return of(newConnection);
                }

                return this.enqueue(query);
            }),
        )
    }

    enqueue(query: SaneQuery) {
        this.requestQueue = [
            ...this.requestQueue,
            query
        ];

        return this.availableConnections.pipe(
            skipWhile((availableConnections) => {
                const nextQuery = _head(this.requestQueue);

                return !(nextQuery && nextQuery.queryId === query.queryId && arrayHasItems(availableConnections));
            }),
            map((availableConnections) => _head(availableConnections)!),
            tap(() => {
                this.requestQueue = _filter(this.requestQueue, ({queryId}) => queryId !== query.queryId);
            }),
            take(1)
        );
    }

    dequeue(_: SaneQuery, connection: Connection) {
        return this.availableConnections.pipe(
            take(1),
            tap((availableConnections) => {
                this.availableConnections.next([
                    ...availableConnections,
                    connection
                ])
            })
        )
    }
}
