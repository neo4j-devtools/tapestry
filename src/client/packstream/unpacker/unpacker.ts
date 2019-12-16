import {BOLT_RESPONSE_DATA_TYPES} from './unpacker.constants';
import {BOLT_PROTOCOLS} from '../../connection/connection.constants';
import {unpackerV1, unpackV1Message} from './unpacker.v1';

export type Unpacker<T extends any = any> = (protocol: BOLT_PROTOCOLS, dataType: BOLT_RESPONSE_DATA_TYPES, view: DataView, size: number, pos: number) => UnpackerReturn<T>;
export type UnpackerInternal<T extends any = any> = (protocol: BOLT_PROTOCOLS, dataType: BOLT_RESPONSE_DATA_TYPES, view: DataView, size: number, pos: number, unpacker: UnpackerInternal<T>) => UnpackerReturn<T>;
export type UnpackerReturn<T> = { finalPos: number, data: T };

export function unpackResponseData<T extends any = any>(protocol: BOLT_PROTOCOLS, view: DataView, unpacker?: UnpackerInternal<T>): UnpackerReturn<T> {
    switch (protocol) {
        case BOLT_PROTOCOLS.V1:
        case BOLT_PROTOCOLS.V2:
        default:
            return unpackV1Message(view, 0, unpacker || unpackerV1);
    }
}
