import {BOLT_RESPONSE_DATA_TYPES} from './unpacker.constants';
import {BOLT_PROTOCOLS} from '../../connection.constants';
import {List} from '../../../monads/index';
import {unpackerV1, unpackV1Message} from './unpacker.v1';

export type Unpacker = (protocol: BOLT_PROTOCOLS, dataType: BOLT_RESPONSE_DATA_TYPES, view: DataView, size: number, pos: number) => UnpackerReturn<any>;
export type UnpackerInternal = (protocol: BOLT_PROTOCOLS, dataType: BOLT_RESPONSE_DATA_TYPES, view: DataView, size: number, pos: number, unpacker: UnpackerInternal) => UnpackerReturn<any>;
export type UnpackerReturn<T> = {finalPos: number, data: T};

export function unpackResponseData(protocol: BOLT_PROTOCOLS, view: DataView, unpacker?: UnpackerInternal): UnpackerReturn<List> {
    switch (protocol) {
        case BOLT_PROTOCOLS.V1:
        case BOLT_PROTOCOLS.V2:
        default:
            return unpackV1Message(view, 0, unpacker || unpackerV1);
    }
}
