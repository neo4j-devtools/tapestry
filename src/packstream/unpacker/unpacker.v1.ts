import {UnpackerInternal, UnpackerReturn} from '../../types';

import {
    DateMonad,
    DateTime,
    Dict,
    Duration,
    List,
    LocalDateTime,
    LocalTime,
    Maybe,
    Monad,
    NodeMonad,
    None,
    Num,
    Path,
    PathSegment,
    Point,
    Relationship,
    TimeMonad,
    UnboundRelationship
} from '../../monads';
import {BOLT_RESPONSE_DATA_TYPES, NUMBER_TYPES} from './unpacker.constants';
import {BOLT_PROTOCOLS} from '../../connection';
import {
    readUint16,
    readUint32,
    readUint8,
    unpackBool,
    unpackNil,
    unpackNone,
    unpackNumber,
    unpackString,
    unwindList
} from './unpacker.utils';

export function unpackerV1(_: BOLT_PROTOCOLS, dataType: BOLT_RESPONSE_DATA_TYPES, view: DataView, size: number, pos: number, unpacker: UnpackerInternal): UnpackerReturn<Monad<any>> {
    const isDefaultUnpacker = unpacker === unpackerV1;

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

            return {
                finalPos,
                data: isDefaultUnpacker ? tryGetStructMonad(List.of(struct)) : List.of(struct)
            };
        }

        case BOLT_RESPONSE_DATA_TYPES.NULL: {
            return unpackNil(view, pos);
        }

        case BOLT_RESPONSE_DATA_TYPES.BOOLEAN: {
            return unpackBool(view, pos);
        }

        case BOLT_RESPONSE_DATA_TYPES.UNKNOWN:
        default: {
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

    // @todo: wat is dis
    return {finalPos, data: Num.of(message - 0x100)};
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
    const firstBytes = struct.first.getOrElse(Num.ZERO);
    const rest: List<any> = struct.slice(1);

    switch (firstBytes.getOrElse(0)) {
        case 0x44: {
            return DateMonad.fromMessage(...rest);
        }

        case 0x45: {
            return Duration.of(unwindList(rest, ['months', 'days', 'seconds', 'nanoseconds']));
        }

        case 0x66:
        case 0x46: {
            return DateTime.fromMessage(...rest);
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
            return TimeMonad.fromMessage(...rest);
        }

        case 0x58: {
            return Point.of(unwindList(rest, ['srid', 'x', 'y']));
        }

        case 0x64: {
            return LocalDateTime.fromMessage(...rest);
        }

        case 0x72: {
            return UnboundRelationship.of(unwindList(rest, ['identity', 'type', 'properties']));
        }

        case 0x74: {
            return LocalTime.fromMessage(...rest);
        }

        default: {
            return struct;
        }
    }
}

type PathParam = [List<NodeMonad>, List<UnboundRelationship>, List<Num>];

function mapListToPath(list: List): Path {
    // @todo: typings and no destructuring
    let [nodes, relations, sequence] = <PathParam>[...list];
    const noSequences = sequence.length.getOrElse(0);
    const segments: PathSegment[] = [];
    let start: NodeMonad = nodes.first.getOrElse(NodeMonad.EMPTY);
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
            : relations.getIndex(relIndex.add(relations.length)).getOrElse(UnboundRelationship.EMPTY);

        segments.push(PathSegment.of({
            start,
            relationship: UnboundRelationship.isUnboundRelationship(rel)
                ? rel.bind(start.identity, end.identity)
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
