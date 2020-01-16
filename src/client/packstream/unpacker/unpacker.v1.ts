import {assign} from 'lodash';

import {
    Bool,
    DateMonad,
    DateTime,
    Dict,
    Duration,
    List,
    LocalDateTime,
    LocalTime,
    Maybe,
    Monad,
    Nil,
    NodeMonad,
    None,
    Num,
    Path,
    Point,
    Relationship,
    Str,
    TimeMonad,
    UnboundRelationship
} from '../../../monads/index';
import PathSegment from '../../../monads/graph/path-segment.monad';
import {BOLT_RESPONSE_DATA_TYPES, NUMBER_TYPES} from './unpacker.constants';
import {UnpackerInternal, UnpackerReturn} from './unpacker';
import {BOLT_PROTOCOLS} from '../../connection.constants';

export function unpackerV1(_: BOLT_PROTOCOLS, dataType: BOLT_RESPONSE_DATA_TYPES, view: DataView, size: number, pos: number, unpacker: UnpackerInternal): UnpackerReturn<any> {
    switch (dataType) {
        case BOLT_RESPONSE_DATA_TYPES.INT8:
        case BOLT_RESPONSE_DATA_TYPES.INT16:
        case BOLT_RESPONSE_DATA_TYPES.INT32:
        case BOLT_RESPONSE_DATA_TYPES.INT64:
        case BOLT_RESPONSE_DATA_TYPES.UINT8:
        case BOLT_RESPONSE_DATA_TYPES.UINT16:
        case BOLT_RESPONSE_DATA_TYPES.UINT32:
        case BOLT_RESPONSE_DATA_TYPES.FLOAT64: {
            return unpackNumber(view, NUMBER_TYPES[dataType], pos);
        }

        case BOLT_RESPONSE_DATA_TYPES.STRING: {
            return unpackString(view, size, pos);
        }

        case BOLT_RESPONSE_DATA_TYPES.LIST: {
            const {finalPos, data} = unpackList(view, size, pos, unpacker);

            return {finalPos, data: List.of(data)};
        }

        case BOLT_RESPONSE_DATA_TYPES.MAP: {
            const {finalPos, data} = unpackMap(view, size, pos, unpacker);

            return {finalPos, data: Dict.fromObject(data)};
        }

        case BOLT_RESPONSE_DATA_TYPES.STRUCT: {
            const {finalPos, data: struct} = unpackStructure(view, size, pos, unpacker);

            return {finalPos, data: tryGetStructMonad(List.of(struct))};
        }

        case BOLT_RESPONSE_DATA_TYPES.NULL: {
            return unpackNil(view, pos);
        }

        case BOLT_RESPONSE_DATA_TYPES.BOOLEAN: {
            return unpackBool(view, pos);
        }

        case BOLT_RESPONSE_DATA_TYPES.UNKNOWN: {
            return unpackNone(view, pos);
        }
    }
}

export function unpackV1Message(view: DataView, pos: number = 0, unpacker: UnpackerInternal): UnpackerReturn<any> {
    const message = view.getUint8(pos);
    const finalPos = pos + 1;

    if (message < 0x80) {
        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.UINT8, view, 0, pos, unpacker);
    }

    if (message < 0x90) {
        const size = message - 0x80;

        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.STRING, view, size, finalPos, unpacker);
    }

    if (message < 0xA0) {
        const size = message - 0x90;

        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.LIST, view, size, finalPos, unpacker);
    }

    if (message < 0xB0) {
        const size = message - 0xA0;

        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.MAP, view, size, finalPos, unpacker);
    }

    if (message < 0xC0) {
        const size = message - 0xB0;

        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.STRUCT, view, size, finalPos, unpacker);
    }

    if (message < 0xC1) {
        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.NULL, view, 0, pos, unpacker);
    }

    if (message < 0xC2) {
        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.FLOAT64, view, 0, finalPos, unpacker);
    }

    if (message < 0xC4) {
        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.BOOLEAN, view, 0, pos, unpacker);
    }

    if (message < 0xC8) {
        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.UNKNOWN, view, 0, pos, unpacker);
    }

    if (message < 0xC9) {
        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.INT8, view, 0, finalPos, unpacker);
    }

    if (message < 0xCA) {
        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.INT16, view, 0, finalPos, unpacker);
    }

    if (message < 0xCB) {
        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.INT32, view, 0, finalPos, unpacker);
    }

    if (message < 0xCC) {
        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.INT64, view, 0, finalPos, unpacker);
    }

    if (message < 0xD0) {
        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.UNKNOWN, view, 0, pos, unpacker);
    }

    if (message < 0xD1) {
        const size = readUint8(view, finalPos);

        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.STRING, view, size, finalPos + 1, unpacker);
    }

    if (message < 0xD2) {
        const size = readUint16(view, finalPos);

        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.STRING, view, size, finalPos + 2, unpacker);
    }

    if (message < 0xD3) {
        const size = readUint32(view, finalPos);

        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.STRING, view, size, finalPos + 4, unpacker);
    }

    if (message < 0xD4) {
        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.UNKNOWN, view, 0, pos, unpacker);
    }

    if (message < 0xD5) {
        const size = readUint8(view, finalPos);

        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.LIST, view, size, finalPos + 1, unpacker);
    }

    if (message < 0xD6) {
        const size = readUint16(view, finalPos);

        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.LIST, view, size, finalPos + 2, unpacker);
    }

    if (message < 0xD7) {
        const size = readUint32(view, finalPos);

        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.LIST, view, size, finalPos + 4, unpacker);
    }

    if (message < 0xD8) {
        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.UNKNOWN, view, 0, pos, unpacker);
    }

    if (message < 0xD9) {
        const size = readUint8(view, finalPos);

        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.MAP, view, size, finalPos + 1, unpacker);
    }

    if (message < 0xDA) {
        const size = readUint16(view, finalPos);

        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.MAP, view, size, finalPos + 2, unpacker);
    }

    if (message < 0xDB) {
        const size = readUint32(view, finalPos);

        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.MAP, view, size, finalPos + 4, unpacker);
    }

    if (message < 0xF0) {
        // Technically, longer structures fit here,
        // but they're never used
        return unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.UNKNOWN, view, 0, pos, unpacker);
    }

    // @todo: wat
    return {finalPos, data: Num.of(message - 0x100)};
}


function unpackNumber(view: DataView, numberType: NUMBER_TYPES, pos: number): UnpackerReturn<Num> {
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

function unpackNil(_: DataView, pos: number): UnpackerReturn<Nil> {
    return {
        finalPos: pos + 1,
        data: Nil.of()
    };
}

function unpackBool(view: DataView, pos: number): UnpackerReturn<Bool> {
    const {finalPos, data: message} = unpackNumber(view, NUMBER_TYPES.UINT8, pos);

    return {
        finalPos,
        data: message.flatMap((val) => Bool.of(!!(val & 1)))
    };
}

function unpackNone(_: DataView, pos: number): UnpackerReturn<None> {
    return {
        finalPos: pos + 1,
        data: None.of()
    };
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

function unpackString(view: DataView, size: number, pos: number): UnpackerReturn<Str> {
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

function unpackList(view: DataView, size: number, pos: number, unpacker: UnpackerInternal): UnpackerReturn<any[]> {
    const list = [];
    let sizeLeft = size;
    let currPos = pos;

    while (sizeLeft) {
        sizeLeft--;

        const {finalPos: newPos, data} = unpackV1Message(view, currPos, unpacker);

        list.push(data);
        currPos = newPos;
    }

    return {finalPos: currPos, data: list};
}

function unpackMap(view: DataView, size: number, pos: number, unpacker: UnpackerInternal): UnpackerReturn<any[]> {
    const map: any = {};
    let sizeLeft = size;
    let currPos = pos;

    while (sizeLeft) {
        sizeLeft--;

        const {finalPos: newPos, data: key} = unpackV1Message(view, currPos, unpacker);
        const {finalPos: newPosAgain, data: value} = unpackV1Message(view, newPos, unpacker);

        currPos = newPosAgain;
        map[`${key}`] = value;
    }

    return {finalPos: currPos, data: map};
}

function unpackStructure(view: DataView, size: number, pos: number, unpacker: UnpackerInternal): UnpackerReturn<any[]> {
    const {finalPos, data} = unpacker(BOLT_PROTOCOLS.V1, BOLT_RESPONSE_DATA_TYPES.UINT8, view, 0, pos, unpacker);
    const fields: any[] = [data];
    let sizeLeft = size;
    let currPos = finalPos;

    while (sizeLeft) {
        sizeLeft--;

        const {finalPos: newPos, data} = unpackV1Message(view, currPos, unpacker);

        fields.push(data);
        currPos = newPos;
    }


    return {finalPos: currPos, data: fields};
}

function tryGetStructMonad(struct: List): Monad<any> {
    // @todo: could be optimised
    const firstBytes = struct.first().getOrElse(Num.of(0));
    const rest = struct.slice(1);

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
            return NodeMonad.of(unwindList(rest, ['identity', 'labels', 'properties']));
        }

        case 0x50: {
            // @ts-ignore
            return mapListToPath(rest);
        }

        case 0x52: {
            return Relationship.of(unwindList(rest, ['start', 'end', 'type', 'properties']));
        }

        case 0x54: {
            return TimeMonad.of({
                // @todo
                seconds: (<Maybe<Num>>rest.first()).getOrElse(Num.of(0)).divide(1000000000),
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
            return UnboundRelationship.of(unwindList(rest, ['identity', 'type', 'properties']));
        }

        case 0x74: {
            return LocalTime.of({
                // @todo
                seconds: (<Maybe<Num>>rest.first()).getOrElse(Num.of(0)).divide(1000000000)
            });
        }

        default: {
            return struct;
        }
    }
}

function unwindList(data: List, keys: string[]): { [key: string]: Monad<any> } {
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

type PathParam = [List<NodeMonad>, List<UnboundRelationship>, List<Num>];

function mapListToPath(list: List): Path {
    // @todo: typings and no desctructuring
    let [nodes, relations, sequence] = <PathParam>[...list];
    const noSequences = sequence.getLength().getOrElse(0);
    const segments: PathSegment[] = [];
    let start: NodeMonad = nodes.first().getOrElse(NodeMonad.EMPTY);
    let last: NodeMonad = start;

    for (let index = 0; index < noSequences; index += 2) {
        const relIndex = sequence.getIndex(index).get();
        const end = sequence.getIndex(2 * index + 1).flatMap((val) => None.isNone(val)
            ? Maybe.of(NodeMonad.EMPTY)
            : nodes.getIndex(val)
        ).get();

        // @todo: so many questions...
        if (None.isNone(relIndex) || None.isNone(end)) {
            continue;
        }

        // @todo: so many questions...
        const rel = relIndex.greaterThan(0)
            ? relations.getIndex(relIndex.subtract(1)).getOrElse(UnboundRelationship.EMPTY)
            : relations.getIndex(relIndex.add(relations.getLength())).getOrElse(UnboundRelationship.EMPTY);

        segments.push(PathSegment.of({
            start,
            relationship: UnboundRelationship.isUnboundRelationship(rel)
                ? rel.bind(start.getIdentity(), end.getIdentity())
                : rel,
            end
        }));

        last = end;
    }

    return Path.of({
        start,
        segments,
        end: last
    });
}
