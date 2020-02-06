import {IConnectionConfig, IDriverConfig} from '../types';
import {List, Num, Result} from '../monads';

export enum DRIVER_RESULT_TYPE {
    RECORD = 'RECORD',
    SUMMARY = 'FOOTER',
}

export const DEFAULT_CONNECTION_CONFIG: IConnectionConfig<any> = {
    authToken: {
        scheme: 'basic',
        principal: 'neo4j',
        credentials: 'newpassword'
    },
    host: 'localhost',
    port: 7687,
    userAgent: `tapestry/${'1.0.0'}`,
    getResponseHeader(unpacked: List<Num>) {
        const header = unpacked.first.getOrElse(Num.of(DRIVER_HEADERS.FAILURE));

        switch (header.get()) {
            case DRIVER_HEADERS.SUCCESS:
                return DRIVER_HEADERS.SUCCESS;

            case DRIVER_HEADERS.RECORD:
                return DRIVER_HEADERS.RECORD;

            case DRIVER_HEADERS.FAILURE:
            default:
                return DRIVER_HEADERS.FAILURE;
        }
    },
    getResponseData(unpacked: List<List>): List {
        return unpacked.getIndex(1).getOrElse(List.of([]));
    }
};

export const DEFAULT_DRIVER_CONFIG: IDriverConfig = {
    maxPoolSize: 1,
    discoveryIntervalMs: 60 * 1000,
    connectionConfig: DEFAULT_CONNECTION_CONFIG,
    mapToResultHeader: (data: any) => data,
    mapToResult: (headerRecord: any, type: any, data: any) => Result.of({header: headerRecord, type, data: List.from(data)})
};

export enum DRIVER_TRANSACTION_COMMANDS {
    BEGIN = 'BEGIN',
    COMMIT = 'COMMIT',
    ROLLBACK = 'ROLLBACK',
}

export enum DRIVER_QUERY_COMMANDS {
    HELLO = 'HELLO',
    RUN = 'RUN',
    PULL = 'PULL'
}

export enum DRIVER_HEADERS {
    SUCCESS = 0x70,
    RECORD = 0x71,
    FAILURE = 0x7F
}

export enum DBMS_MEMBER_ROLE {
    LEADER = 'LEADER',
    FOLLOWER = 'FOLLOWER'
}

export enum DBMS_DB_STATUS {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE'
}
