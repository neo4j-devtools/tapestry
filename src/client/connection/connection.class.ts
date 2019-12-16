import uuid from 'uuid/v4';

import {ConnectionConfig, SaneQuery} from './connection.types';

import Pool from '../pool/pool.class';
import Stream from '../stream/stream.class';

export default class Connection {
    public readonly connectionId = uuid();
    public readonly connectionConfig: ConnectionConfig;

    static makeConfig(pool: Pool) {
        return {};
    }

    constructor(private readonly pool: Pool) {
        this.connectionConfig = Connection.makeConfig(pool);
    }

    sendQuery(query: SaneQuery) {
        // send request and return meta obj w id & status etc.
        return new Stream(this, query);
    }
}

