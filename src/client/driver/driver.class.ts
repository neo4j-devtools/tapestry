import {flatMap} from 'rxjs/operators';
import uuid from 'uuid/v4';

import {DriverOptions, QueryOptions, DriverConfig} from './driver.types';
import {SaneQuery} from '../connection/connection.types';

import {DEFAULT_RESULT_CHUNK_SIZE, QUERY_MODES, DEFAULT_MAX_CONCURRENT_CONNECTIONS} from './driver.constants';
import Pool from '../pool/pool.class';

export default class Driver {
    public readonly driverId = uuid();
    public readonly driverConfig: DriverConfig;
    private readonly pool: Pool;

    static makeConfig(options: DriverOptions): DriverConfig {
        return {
            encrypted: options.encrypted || true,
            endpoint: options.endpoint,
            auth: options.auth,
            maxConcurrentConnections: options.maxConcurrentConnections || DEFAULT_MAX_CONCURRENT_CONNECTIONS
        }
    }

    constructor(options: DriverOptions) {
        this.driverConfig = Driver.makeConfig(options);
        this.pool = new Pool(this);
    }

    public runQuery(query: QueryOptions) {
        const sanitizedQuery: SaneQuery = {
            queryId: uuid(),
            dbName: query.dbName,
            mode: query.mode || QUERY_MODES.READ_MODE,
            query: query.query,
            parameters: query.parameters || {},
            resultChunkSize: query.resultChunkSize || DEFAULT_RESULT_CHUNK_SIZE
        };

        return this.pool.getNextAvailableConnection(sanitizedQuery).pipe(
            flatMap((connection) => connection.sendQuery(sanitizedQuery))
        )
    }
}
