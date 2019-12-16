import {BOLT_PROTOCOLS} from '../../connection/connection.constants';
import {BOLT_REQUEST_DATA_TYPE} from './packer.constants';
import {packerV1, packV1Message} from './packer.v1';

export type Packer<T extends any = any> = (protocol: BOLT_PROTOCOLS, dataType: BOLT_REQUEST_DATA_TYPE, data: T) => number[];
export type PackerInternal<T extends any = any> = (protocol: BOLT_PROTOCOLS, dataType: BOLT_REQUEST_DATA_TYPE, data: T, packer: PackerInternal<T>) => number[];

export function packRequestData<T extends any = any>(protocol: BOLT_PROTOCOLS, data: T, packer?: PackerInternal<T>) {
    switch (protocol) {
        case BOLT_PROTOCOLS.V1:
        case BOLT_PROTOCOLS.V2:
        default:
            return packV1Message(data, packer || packerV1);
    }
}
