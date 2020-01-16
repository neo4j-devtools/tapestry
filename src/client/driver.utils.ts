import {V1_BOLT_MESSAGES} from './connection/connection.constants';

export function getTestMessage(): [number, any[]] {
    return [
        V1_BOLT_MESSAGES.RUN,
        ['RETURN 1', {}]
    ]
}

export function getRetrieveMessage(): [number, any[]] {
    return [
        V1_BOLT_MESSAGES.PULL_ALL,
        []
    ];
}
