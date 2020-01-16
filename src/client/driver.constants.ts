import {IConnectionParams} from './types';

export const DEFAULT_PARAMS: IConnectionParams<any> = {
    auth: {
        scheme: 'basic',
        principal: 'neo4j',
        credentials: 'newpassword'
    },
    host: 'localhost',
    port: 7687,
    // @ts-ignore
    userAgent: `tapestry/${'1.0.0'}`
};
