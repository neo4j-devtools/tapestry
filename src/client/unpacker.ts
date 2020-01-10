import {assign, reduce, head, tail} from 'lodash';

import {
    DateMonad,
    DateTime,
    Duration,
    NodeMonad,
    // Path,
    Relationship,
    TimeMonad,
    Point,
    LocalDateTime,
    UnboundRelationship,
    LocalTime
} from '../monads/index';
import Monad from '../monads/monad';

export function unpackResponseMessage(view: DataView, pos: number = 0): { finalPos: number, data: any } {
    const message = view.getUint8(pos);
    const finalPos = pos + 1;

    if (message < 0x80) {
        return {finalPos, data: message};
    }

    if (message < 0x90) {
        const size = message - 0x80;

        return unpackString(view, size, finalPos);
    }

    if (message < 0xA0) {
        const size = message - 0x90;

        return unpackList(view, size, finalPos);
    }

    if (message < 0xB0) {
        const size = message - 0xA0;

        return unpackMap(view, size, finalPos);
    }

    if (message < 0xC0) {
        const size = message - 0xB0;

        return hydrateStructure(view, size, finalPos);
    }

    if (message < 0xC1) {
        return {finalPos, data: null};
    }

    if (message < 0xC2) {
        return {
            finalPos: finalPos + 8,
            data: view.getFloat64(finalPos, false)
        };
    }

    if (message < 0xC4) {
        return {finalPos, data: !!(message & 1)};
    }

    if (message < 0xC8) {
        return {finalPos, data: undefined};
    }

    if (message < 0xC9) {
        return {
            finalPos: finalPos + 1,
            data: view.getInt8(finalPos + 1)
        };
    }

    if (message < 0xCA) {
        return {
            finalPos: finalPos + 2,
            data: view.getInt16(finalPos, false)
        };
    }

    if (message < 0xCB) {
        return {
            finalPos: finalPos + 4,
            data: view.getInt32(finalPos, false)
        };
    }

    if (message < 0xCC) {
        return {
            finalPos: finalPos + 8,
            data: readInt64(view, finalPos)
        };
    }

    if (message < 0xD0) {
        return {finalPos, data: undefined};
    }

    if (message < 0xD1) {
        return unpackString(view, readUint8(view, finalPos), finalPos + 1);
    }

    if (message < 0xD2) {
        return unpackString(view, readUint16(view, finalPos), finalPos + 2);
    }

    if (message < 0xD3) {
        return unpackString(view, readUint32(view, finalPos), finalPos + 4);
    }

    if (message < 0xD4) {
        return {finalPos, data: undefined};
    }

    if (message < 0xD5) {
        return unpackList(view, readUint8(view, finalPos), finalPos + 1);
    }

    if (message < 0xD6) {
        return unpackList(view, readUint16(view, finalPos), finalPos + 2);
    }

    if (message < 0xD7) {
        return unpackList(view, readUint32(view, finalPos), finalPos + 4);
    }

    if (message < 0xD8) {
        return {finalPos, data: undefined};
    }

    if (message < 0xD9) {
        return unpackMap(view, readUint8(view, finalPos), finalPos + 1);
    }

    if (message < 0xDA) {
        return unpackMap(view, readUint16(view, finalPos), finalPos + 2);
    }

    if (message < 0xDB) {
        return unpackMap(view, readUint32(view, finalPos), finalPos + 4);
    }

    if (message < 0xF0) {
        // Technically, longer structures fit here,
        // but they're never used
        return {finalPos, data: undefined};
    }

    return {finalPos, data: message - 0x100};
}

function readUint8(view: DataView, pos: number): number {
    return view.getUint8(pos);
}

function readUint16(view: DataView, pos: number): number {
    return view.getUint16(pos, false);
}

function readUint32(view: DataView, pos: number): number {
    return view.getUint32(pos, false);
}

function readInt64(view: DataView, pos: number): number {
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

function unpackString(view: DataView, size: number, pos: number): { finalPos: number, data: string } {
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

    return {finalPos: currPos, data: str};
}

function unpackList(view: DataView, size: number, pos: number): { finalPos: number, data: any[] } {
    const list = [];
    let sizeLeft = size;
    let currPos = pos;

    while (sizeLeft) {
        sizeLeft--;

        const {finalPos: newPos, data} = unpackResponseMessage(view, currPos + sizeLeft);

        list.push(data);
        currPos = newPos;
    }

    return {finalPos: currPos, data: list};
}

function unpackMap(view: DataView, size: number, pos: number): { finalPos: number, data: any[] } {
    const map: any = {};
    let sizeLeft = size;
    let currPos = pos;

    while (sizeLeft) {
        sizeLeft--;

        const {finalPos: newPos, data: key} = unpackResponseMessage(view, currPos + sizeLeft);
        const {finalPos: newPosAgain, data: value} = unpackResponseMessage(view, newPos + sizeLeft);

        currPos = newPosAgain;
        map[key] = value;
    }

    return map;
}

function unpackStructure(view: DataView, size: number, pos: number): { finalPos: number, data: any[] } {
    const fields = [readUint8(view, pos)];
    let sizeLeft = size;
    let currPos = pos;

    while (sizeLeft) {
        sizeLeft--;

        const {finalPos: newPos, data} = unpackResponseMessage(view, currPos + sizeLeft);

        fields.push(data);
        currPos = newPos;
    }


    return {finalPos: currPos, data: fields};
}

function hydrateStructure(view: DataView, size: number, pos: number): { finalPos: number, data: any[] } {
    const {finalPos, data: struct} = unpackStructure(view, size, pos);

    return {finalPos, data: tryGetStructMonad(struct)};
}

function tryGetStructMonad(struct: any[]): Monad<any> | any {
    const firstBytes = head(struct);
    const rest = tail(struct);

    switch (firstBytes) {
        case 0x44: {
            return DateMonad.of(unwind(rest, ['days']));
        }

        case 0x45: {
            return Duration.of(unwind(rest, ['months', 'days', 'seconds', 'nanoseconds']));
        }

        case 0x66:
        case 0x46: {
            return DateTime.of(unwind(rest, ['seconds', 'nanoseconds', 'tz']));
        }

        case 0x4E: {
            return NodeMonad.of(unwind(rest, ['id', 'labels', 'properties']));
        }

        /* @todo
        case 0x50: {
            return Path.of(rest);
        }
        */

        case 0x52: {
            return Relationship.of(unwind(rest, ['start', 'end', 'type', 'properties']));
        }

        case 0x54: {
            return TimeMonad.of({
                seconds: struct[0] / 1000000000,
                tz: struct[1]
            });
        }

        case 0x58: {
            return Point.of(unwind(rest, ['srid', 'x', 'y']));
        }

        case 0x64: {
            return LocalDateTime.of(unwind(rest, ['seconds', 'nanoseconds']));
        }

        case 0x72: {
            return UnboundRelationship.of(rest);
        }

        case 0x74: {
            return LocalTime.of({
                seconds: struct[0] / 1000000000
            });
        }

        default: {
            return struct;
        }
    }
}

function unwind(data: any[], keys: string[]) {
    return reduce(keys, (agg, key, index) => {
        return assign(agg, {
            [key]: data[index]
        });
    }, {});
}
