import {assign} from 'lodash';

import {UnpackerReturn} from '../../types';

import {NUMBER_TYPES} from './unpacker.constants';
import {Bool, Monad, Nil, None, Num, Str} from '../../monads';

export function unpackNumber(view: DataView, numberType: NUMBER_TYPES, pos: number): UnpackerReturn<Num> {
    switch (numberType) {
        case NUMBER_TYPES.INT8: {
            return {
                finalPos: pos + 1,
                data: Num.of(view.getInt8(pos + 1))
            };
        }

        case NUMBER_TYPES.INT16: {
            return {
                finalPos: pos + 2,
                data: Num.of(view.getInt16(pos, false))
            };
        }

        case NUMBER_TYPES.INT32: {
            return {
                finalPos: pos + 4,
                data: Num.of(view.getInt32(pos, false))
            };
        }

        case NUMBER_TYPES.UINT8: {
            return {
                finalPos: pos + 1,
                data: Num.of(readUint8(view, pos))
            };
        }

        case NUMBER_TYPES.UINT16: {
            return {
                finalPos: pos + 2,
                data: Num.of(readUint16(view, pos))
            };
        }

        case NUMBER_TYPES.UINT32: {
            return {
                finalPos: pos + 4,
                data: Num.of(readUint16(view, pos))
            };
        }

        case NUMBER_TYPES.INT64: {
            return {
                finalPos: pos + 8,
                data: Num.of(readInt64(view, pos))
            };
        }

        case NUMBER_TYPES.FLOAT64: {
            return {
                finalPos: pos + 8,
                data: Num.of(view.getFloat64(pos, false))
            };
        }

        default: {
            return {
                finalPos: pos + 1,
                data: Num.of(view.getUint8(pos))
            };
        }
    }
}

export function unpackNil(_: DataView, pos: number): UnpackerReturn<Nil> {
    return {
        finalPos: pos + 1,
        data: Nil.of()
    };
}

export function unpackBool(view: DataView, pos: number): UnpackerReturn<Bool> {
    const {finalPos, data: message} = unpackNumber(view, NUMBER_TYPES.UINT8, pos);

    return {
        finalPos,
        data: message.flatMap((val) => Bool.of(!!(val & 1)))
    };
}

export function unpackNone(_: DataView, pos: number): UnpackerReturn<None> {
    return {
        finalPos: pos + 1,
        data: None.of()
    };
}

export function readUint8(view: DataView, pos: number): number {
    return view.getUint8(pos);
}

export function readUint16(view: DataView, pos: number): number {
    return view.getUint16(pos, false);
}

export function readUint32(view: DataView, pos: number): number {
    return view.getUint32(pos, false);
}

export function readInt64(view: DataView, pos: number): number {
    let high = readUint32(view, pos).toString(16);
    let low = readUint32(view, pos + 4).toString(16);

    while (high.length < 8) {
        high = '0' + high;
    }

    while (low.length < 8) {
        low = '0' + low;
    }

    return parseInt('0x' + high + low, 16);
}

export function unpackString(view: DataView, size: number, pos: number): UnpackerReturn<Str> {
    const replacementCharacter = '\uFFFD';
    const end = pos + size;
    let currPos = pos;
    let str = '';

    while (currPos < end) {
        const leadingByte = readUint8(view, currPos);

        currPos++;

        if (leadingByte < 0x80) {
            str += String.fromCharCode(leadingByte);

            continue;
        }

        if (leadingByte < 0xC0) {
            str += replacementCharacter;

            continue;
        }

        if (leadingByte < 0xE0) {
            if (currPos + 1 > end) {
                str += replacementCharacter;

                continue;
            }

            str += String.fromCharCode(((leadingByte & 0x1F) << 6) |
                (readUint8(view, currPos) & 0x3F));

            currPos++;

            continue;
        }

        if (leadingByte < 0xF0) {
            if (currPos + 2 > end) {
                str += replacementCharacter;

                continue;
            }

            str += String.fromCharCode(((leadingByte & 0x0F) << 12) |
                ((readUint8(view, currPos) & 0x3F) << 6) |
                (readUint8(view, currPos + 1) & 0x3F));

            currPos += 2;

            continue;
        }

        if (currPos + 3 > end) {
            str += replacementCharacter;

            continue;
        }

        const codePoint = (((leadingByte & 0x07) << 18) |
            ((readUint8(view, currPos) & 0x3F) << 12) |
            ((readUint8(view, currPos + 1) & 0x3F) << 6) |
            (readUint8(view, currPos + 2) & (0x3F))) - 0x10000;

        currPos += 3;

        str += String.fromCharCode((codePoint >> 10) + 0xD800, (codePoint % 0x400) + 0xDC00);
    }

    return {finalPos: currPos, data: Str.of(str)};
}

export function unwindList<T = Monad<any>>(data: Iterable<T>, keys: string[]): { [key: string]: T } {
    let index = 0;
    const agg = {};

    for (const item of data) {
        if (index >= keys.length) {
            break;
        }

        assign(agg, {
            [keys[index]]: item
        });

        index++;
    }

    return agg;
}
