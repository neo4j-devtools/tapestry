import {ACCESS_MODES} from '../driver/driver.constants';

export type ConnectionConfig = {};

export type SaneQuery = {
    queryId: string,
    dbName: string,
    mode: ACCESS_MODES,
    query: string,
    parameters: {[key: string]: any},
    resultChunkSize: 100
}

export type Member = {
    memberId: string;
    address: string;
    protocol: string;
    host: string;
    path: string;
    port: string;
    // yada...
}

export type PoolConfig = {
    members: Member[]
}
