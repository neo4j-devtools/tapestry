import uuid from 'uuid/v4';
import {Observable, Subject} from 'rxjs';
import {flatMap, map, skipWhile, take, takeWhile} from 'rxjs/operators';
import {filter as _filter, forEach as _forEach, merge as _merge} from 'lodash';

import {IConnectionParams} from './types';

import Connection from './connection/connection.class';
import {DEFAULT_PARAMS, DRIVER_COMMANDS, DRIVER_HEADERS} from './driver.constants';

export interface IQuery {
    cmd: DRIVER_COMMANDS;
    data: any[];
}

export interface IRequest {
    id: string;
    queries: IQuery[];
}

export default class Driver<Data = any> {
    protected connections: Connection<Data>[] = [];
    protected availableConnection: Subject<Connection<Data>> = new Subject<Connection<Data>>();
    protected requestQueue: Subject<IRequest> = new Subject();
    // @ts-ignore
    protected processing: Observable<[IRequest, Connection<Data>]> = this.requestQueue.pipe(
        flatMap((request) => {
            return this.availableConnection.pipe(
                map((connection) => [request, connection])
            );
        })
    );

    constructor(protected params: Partial<IConnectionParams<Data>>) {
        this.addConnection();
        this.getNextAvailableConnection();
    }

    runQuery(cypher: string, params: any = {}) {
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
            skipWhile(([request]) => {
                console.log((request));
                return request.id !== requestID;
            }),
            take(1),
            flatMap(([request, connection]) => this.executeRequests(request, connection))
        );
    }

    protected executeRequests(request: IRequest, connection: Connection<Data>) {
        _forEach(request.queries, (query) => {
            connection.sendMessage(query.cmd, query.data);
        });

        return new Observable<Data>((subscriber) => {
            let remaining = request.queries.length;

            connection.pipe(takeWhile(() => remaining !== 0)).subscribe({
                next: (message) => {
                    const {header, data} = message;

                    if (header === DRIVER_HEADERS.FAILURE) {
                        remaining = 0;
                        subscriber.error(data);
                        subscriber.complete();

                        return;
                    }

                    subscriber.next(data);

                    if (header === DRIVER_HEADERS.SUCCESS) {
                        remaining -= 1;
                    }

                    if (remaining === 0) {
                        subscriber.complete();
                        this.availableConnection.next(connection);
                    }
                },
                error: (err) => {
                    remaining = 0;
                    subscriber.error(err);
                    subscriber.complete();
                    this.terminateConnection(connection);
                }
            });
        });
    }

    protected addConnection() {
        const connectionParams = _merge({}, DEFAULT_PARAMS, this.params);
        const connection = new Connection<Data>(connectionParams);

        this.connections.push(connection);
    }

    protected getNextAvailableConnection() {
        this.availableConnection.next(this.connections[0]);
    }

    protected terminateConnection(connection: Connection<Data>) {
        connection.terminate();
        this.connections = _filter(this.connections, ({id}) => id !== connection.id);
    }
}
