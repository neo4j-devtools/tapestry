import {UnpackerReturn} from '../../types';

import {BOLT_PROTOCOLS} from '../../connection';
import {BOLT_RESPONSE_DATA_TYPES} from './unpacker.constants';
import {unpackerV1} from './unpacker.v1';


export function JsonUnpacker(protocol: BOLT_PROTOCOLS, dataType: BOLT_RESPONSE_DATA_TYPES, view: DataView, size: number, pos: number): UnpackerReturn<any> {
    switch (dataType) {
        default: {
            const {finalPos, data} = unpackerV1(protocol, dataType, view, size, pos, JsonUnpacker);

            return {finalPos, data: JSON.parse(JSON.stringify(data))}
        }
    }
}
