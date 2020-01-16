import {BOLT_PROTOCOLS} from '../../connection.constants';
import {BOLT_REQUEST_DATA_TYPE} from './packer.constants';
import {packerV1, packV1Message} from './packer.v1';


export type Packer = (protocol: BOLT_PROTOCOLS, dataType: BOLT_REQUEST_DATA_TYPE, data: any) => number[];
export type PackerInternal = (protocol: BOLT_PROTOCOLS, dataType: BOLT_REQUEST_DATA_TYPE, data: any, packer: PackerInternal) => number[];

export function packRequestData(protocol: BOLT_PROTOCOLS, data: any, packer?: PackerInternal) {
    switch (protocol) {
        case BOLT_PROTOCOLS.V1:
        case BOLT_PROTOCOLS.V2:
        default:
            return packV1Message(data, packer || packerV1);
    }
}
