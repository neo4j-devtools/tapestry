import {BehaviorSubject} from 'rxjs';
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
    // @todo: BehaviorSubject could be a problem, take(1) interaction?
    private readonly activeConnections = new BehaviorSubject<Connection[]>([]);
    private readonly availableConnections = new BehaviorSubject<Connection[]>([]);
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
                    return this.createNewConnection();
                }

                this.addToRequestQueue(query);

                return this.availableConnections.pipe(
                    skipWhile((availableConnections) => {
                        const nextQuery = _head(this.requestQueue);

                        return !(nextQuery && nextQuery.queryId === query.queryId && arrayHasItems(availableConnections));
                    }),
                    map((availableConnections) => _head(availableConnections)!),
                    tap(() => this.removeFromRequestQueue(query)),
                    take(1)
                );
            }),
        )
    }

    addToRequestQueue(query: SaneQuery) {
        this.requestQueue = [
            ...this.requestQueue,
            query
        ];
    }

    removeFromRequestQueue(query: SaneQuery) {
        this.requestQueue = _filter(this.requestQueue, ({queryId}) => queryId !== query.queryId);
    }

    createNewConnection() {
        return this.activeConnections.pipe(
            take(1),
            map((activeConnections) => {
                const newConnection = new Connection(this);

                this.activeConnections.next([
                    ...activeConnections,
                    newConnection
                ]);

                return newConnection
            })
        );
    }

    destroyConnection(connection: Connection) {
        return this.activeConnections.pipe(
            take(1),
            map((activeConnections) => {
                this.activeConnections.next(_filter(activeConnections, ({connectionId}) => connectionId !== connection.connectionId));

                return connection
            })
        );
    }
}
