import {ACCESS_MODES} from './driver.constants';

export type AuthOptions = {
    username: string;
    password: string
} | { token: string } // etc.

export type DriverOptions = {
    encrypted?: boolean;
    endpoint: string;
    auth: AuthOptions;
    maxConcurrentConnections?: number
    // and more
}

export type DriverConfig = {
    encrypted: boolean;
    endpoint: string;
    auth: AuthOptions;
    maxConcurrentConnections: number
    // and more
}

export type QueryOptions = {
    dbName: string,
    mode?: ACCESS_MODES,
    query: string,
    parameters?: {[key: string]: any},
    resultChunkSize?: 100
}
