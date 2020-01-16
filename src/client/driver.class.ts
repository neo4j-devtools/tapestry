import autobind from 'autobind-decorator';
import {BehaviorSubject} from 'rxjs';

import {IConnectionParams} from './types';

import Connection from './connection/connection.class';

export default class Driver<T = any> {
    protected connections: Connection<T>[] = [];
    protected available: BehaviorSubject<Connection<T>[]> = new BehaviorSubject([]);

    constructor(protected params: IConnectionParams<T>) {
        this.connections = [new Connection<T>(params)];
    }

    runQuery(cypher: string, params: any = {}) {

    }

    @autobind
    handleConnectionNext()
}
