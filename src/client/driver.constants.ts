import {IConnectionParams} from './types';
import {List, Num} from '../monads';

export const DEFAULT_PARAMS: IConnectionParams<any> = {
    auth: {
        scheme: 'basic',
        principal: 'neo4j',
        credentials: 'newpassword'
    },
    host: 'localhost',
    port: 7687,
    // @ts-ignore
    userAgent: `tapestry/${'1.0.0'}`,
    getHeader(unpacked: List<Num>) {
        const header = unpacked.first().getOrElse(Num.of(DRIVER_HEADERS.FAILURE));

        switch(header.get()) {
            case DRIVER_HEADERS.SUCCESS:
                return DRIVER_HEADERS.SUCCESS;

            case DRIVER_HEADERS.RECORD:
                return DRIVER_HEADERS.RECORD;

            case DRIVER_HEADERS.FAILURE:
            default:
                return DRIVER_HEADERS.FAILURE;
        }
    },
    getData(unpacked: List<List>): List {
        return unpacked.getIndex(1).getOrElse(List.of([]))
    }
};

export enum DRIVER_COMMANDS {
    INIT = 'INIT',
    RUN = 'RUN',
    PULL_ALL = 'PULL_ALL',
}

export enum DRIVER_HEADERS  {
    SUCCESS = 0x70,
    RECORD = 0x71,
    FAILURE = 0x7F
}
