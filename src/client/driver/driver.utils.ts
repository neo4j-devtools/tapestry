import {DRIVER_COMMANDS} from './driver.constants';

export function getTestMessage(): [DRIVER_COMMANDS, any[]] {
    return [
        DRIVER_COMMANDS.RUN,
        ['RETURN 1', {}]
    ];
}

export function getRetrieveMessage(): [DRIVER_COMMANDS, any[]] {
    return [
        DRIVER_COMMANDS.PULL_ALL,
        []
    ];
}
