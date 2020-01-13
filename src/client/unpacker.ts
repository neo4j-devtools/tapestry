import {assign} from 'lodash';

import {
    Monad,
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
    LocalTime,
    None,
    Bool,
    Str,
    Nil,
    Num,
    Dict,
    List
} from '../monads';

export function unpackResponseMessage(view: DataView, pos: number = 0): { finalPos: number, data: List } {
    const size = view.getUint8(pos) - 0xB0;
    const finalPos = pos + 1;

    return unpackStructure(view, size, finalPos);
}

function unpackMessage(view: DataView, pos: number = 0): { finalPos: number, data: any } {
    const message = view.getUint8(pos);
    const finalPos = pos + 1;

    if (message < 0x80) {
        return {finalPos, data: Num.of(message)};
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
        return {finalPos, data: Nil.of()};
    }

    if (message < 0xC2) {
        return {
            finalPos: finalPos + 8,
            data: Num.of(view.getFloat64(finalPos, false))
        };
    }

    if (message < 0xC4) {
        return {finalPos, data: Bool.of(!!(message & 1))};
    }

    if (message < 0xC8) {
        return {finalPos, data: None.EMPTY};
    }

    if (message < 0xC9) {
        return {
            finalPos: finalPos + 1,
            data: new Num(view.getInt8(finalPos + 1))
        };
    }

    if (message < 0xCA) {
        return {
            finalPos: finalPos + 2,
            data: new Num(view.getInt16(finalPos, false))
        };
    }

    if (message < 0xCB) {
        return {
            finalPos: finalPos + 4,
            data: new Num(view.getInt32(finalPos, false))
        };
    }

    if (message < 0xCC) {
        return {
            finalPos: finalPos + 8,
            data: new Num(readInt64(view, finalPos))
        };
    }

    if (message < 0xD0) {
        return {finalPos, data: None.EMPTY};
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
        return {finalPos, data: None.EMPTY};
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
        return {finalPos, data: None.EMPTY};
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
        return {finalPos, data: None.EMPTY};
    }

    return {finalPos, data: new Num(message - 0x100)};
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

function unpackString(view: DataView, size: number, pos: number): { finalPos: number, data: Str } {
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

function unpackList(view: DataView, size: number, pos: number): { finalPos: number, data: List } {
    const list = [];
    let sizeLeft = size;
    let currPos = pos;

    while (sizeLeft) {
        sizeLeft--;

        const {finalPos: newPos, data} = unpackMessage(view, currPos);

        list.push(data);
        currPos = newPos;
    }

    return {finalPos: currPos, data: List.of(list)};
}

function unpackMap(view: DataView, size: number, pos: number): { finalPos: number, data: Dict } {
    const map: any = {};
    let sizeLeft = size;
    let currPos = pos;

    while (sizeLeft) {
        sizeLeft--;

        const {finalPos: newPos, data: key} = unpackMessage(view, currPos);
        const {finalPos: newPosAgain, data: value} = unpackMessage(view, newPos);

        currPos = newPosAgain;
        map[key.get()] = value;
    }

    return {finalPos: currPos, data: Dict.fromObject(map)};
}

function unpackStructure(view: DataView, size: number, pos: number): { finalPos: number, data: List } {
    const fields: Monad<any>[] = [Num.of(readUint8(view, pos))];
    let sizeLeft = size;
    let currPos = pos + 1;

    while (sizeLeft) {
        sizeLeft--;

        const {finalPos: newPos, data} = unpackMessage(view, currPos);

        fields.push(data);
        currPos = newPos;
    }


    return {finalPos: currPos, data: List.of(fields)};
}

function hydrateStructure(view: DataView, size: number, pos: number): { finalPos: number, data: Monad<any> } {
    const {finalPos, data: struct} = unpackStructure(view, size, pos);

    return {finalPos, data: tryGetStructMonad(struct)};
}

function tryGetStructMonad(struct: List): Monad<any> {
    // @todo: could be optimised
    const firstBytes = struct.first().getOrElse(Num.of(0));
    const rest = struct.slice<Num>(1); // @todo: Num technically not true

    switch (firstBytes.getOrElse(0)) {
        case 0x44: {
            return DateMonad.of(unwindList(rest, ['days']));
        }

        case 0x45: {
            return Duration.of(unwindList(rest, ['months', 'days', 'seconds', 'nanoseconds']));
        }

        case 0x66:
        case 0x46: {
            return DateTime.of(unwindList(rest, ['seconds', 'nanoseconds', 'tz']));
        }

        case 0x4E: {
            return NodeMonad.of(unwindList(rest, ['id', 'labels', 'properties']));
        }

        /* @todo
        case 0x50: {
            return Path.of(rest);
        }
        */

        case 0x52: {
            return Relationship.of(unwindList(rest, ['start', 'end', 'type', 'properties']));
        }

        case 0x54: {
            return TimeMonad.of({
                seconds: rest.first().getOrElse(Num.of(0)).divide(1000000000),
                tz: rest.first().getOrElse(Num.of(0))
            });
        }

        case 0x58: {
            return Point.of(unwindList(rest, ['srid', 'x', 'y']));
        }

        case 0x64: {
            return LocalDateTime.of(unwindList(rest, ['seconds', 'nanoseconds']));
        }

        case 0x72: {
            return UnboundRelationship.of(rest);
        }

        case 0x74: {
            return LocalTime.of({
                seconds: rest.first().getOrElse(Num.of(0)).divide(1000000000)
            });
        }

        default: {
            // @todo: primitives
            return struct;
        }
    }
}

function unwindList(data: List, keys: string[]) {
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
