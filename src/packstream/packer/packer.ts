import {PackerInternal} from '../../types';

import {BOLT_PROTOCOLS} from '../../connection';
import {packerV1, packV1Message} from './packer.v1';

export function packRequestData<T extends any = any>(protocol: BOLT_PROTOCOLS, data: T, packer?: PackerInternal<T>) {
    switch (protocol) {
        case BOLT_PROTOCOLS.V1:
        case BOLT_PROTOCOLS.V2:
        default:
            return packV1Message(data, packer || packerV1);
    }
}
