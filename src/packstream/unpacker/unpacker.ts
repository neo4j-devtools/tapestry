import {UnpackerInternal, UnpackerReturn} from '../../types';

import {BOLT_PROTOCOLS} from '../../connection/connection.constants';
import {unpackerV1, unpackV1Message} from './unpacker.v1';

export function unpackResponseData<T extends any = any>(protocol: BOLT_PROTOCOLS, view: DataView, unpacker?: UnpackerInternal<T>): UnpackerReturn<T> {
    switch (protocol) {
        case BOLT_PROTOCOLS.V1:
        case BOLT_PROTOCOLS.V2:
        default:
            return unpackV1Message(view, 0, unpacker || unpackerV1);
    }
}
