import {
    BOLT_PROTOCOLS,
    BOLT_RESPONSE_DATA_TYPES,
    NUMBER_TYPES,
    unpackBool,
    UnpackerReturn,
    unpackerV1,
    unpackNumber,
    unpackString,
    unwindList
} from './index';

export function JSONUnpackerV1(protocol: BOLT_PROTOCOLS, dataType: BOLT_RESPONSE_DATA_TYPES, view: DataView, size: number, pos: number): UnpackerReturn<any> {
    switch (dataType) {
        case BOLT_RESPONSE_DATA_TYPES.INT8:
        case BOLT_RESPONSE_DATA_TYPES.INT16:
        case BOLT_RESPONSE_DATA_TYPES.INT32:
        case BOLT_RESPONSE_DATA_TYPES.INT64:
        case BOLT_RESPONSE_DATA_TYPES.UINT8:
        case BOLT_RESPONSE_DATA_TYPES.UINT16:
        case BOLT_RESPONSE_DATA_TYPES.UINT32:
        case BOLT_RESPONSE_DATA_TYPES.FLOAT64: {
            const {finalPos, data} = unpackNumber(view, NUMBER_TYPES[dataType], pos);

            return {finalPos, data: data.getOrElse(0)}
        }

        case BOLT_RESPONSE_DATA_TYPES.STRING: {
            const {finalPos, data} = unpackString(view, size, pos);

            return {finalPos, data: data.getOrElse('')}
        }

        case BOLT_RESPONSE_DATA_TYPES.NULL: {
            return {finalPos: pos + 1, data: null}
        }

        case BOLT_RESPONSE_DATA_TYPES.BOOLEAN: {
            const {finalPos, data} = unpackBool(view, pos);

            return {finalPos, data: data.getOrElse(false)}
        }

        case BOLT_RESPONSE_DATA_TYPES.UNKNOWN: {
            return {finalPos: pos + 1, data: undefined}
        }

        case BOLT_RESPONSE_DATA_TYPES.STRUCT: {
            const {finalPos, data: fields} = unpackerV1(protocol, dataType, view, size, pos, JSONUnpackerV1);

            return {finalPos, data: tryGetStructShape(fields)}
        }

        default: {
            return unpackerV1(protocol, dataType, view, size, pos, JSONUnpackerV1);
        }
    }
}

function tryGetStructShape(struct: any[]): any {
    const firstBytes = struct[0] || 0;
    const rest = struct.slice(1);

    switch (firstBytes) {
        case 0x44: {
            return unwindList(rest, ['days']);
        }

        case 0x45: {
            return unwindList(rest, ['months', 'days', 'seconds', 'nanoseconds']);
        }

        case 0x66:
        case 0x46: {
            return unwindList(rest, ['seconds', 'nanoseconds', 'tz']);
        }

        case 0x4E: {
            return unwindList(rest, ['identity', 'labels', 'properties']);
        }

        case 0x50: {
            return mapListToPath(rest);
        }

        case 0x52: {
            return unwindList(rest, ['start', 'end', 'type', 'properties']);
        }

        case 0x54: {
            return {
                seconds: (rest[0] || 0) / 1000000000,
                tz: (rest[0] || 0)
            };
        }

        case 0x58: {
            return unwindList(rest, ['srid', 'x', 'y']);
        }

        case 0x64: {
            return unwindList(rest, ['seconds', 'nanoseconds']);
        }

        case 0x72: {
            return unwindList(rest, ['identity', 'type', 'properties']);
        }

        case 0x74: {
            return {
                seconds: (rest[0] || 0) / 1000000000,
            };
        }

        default: {
            return struct;
        }
    }
}

type Path = {
    start: any,
    end: any,
    segments: any[]
}

function mapListToPath(list: any[]): Path {
    let [nodes, relations, sequence] = list;
    const noSequences = sequence.length;
    const segments: any[] = [];
    let start = nodes[0] || {};
    let last = start;

    for (let index = 0; index < noSequences; index += 2) {
        const relIndex = sequence[index];
        const end = sequence[2 * index + 1] !== undefined
            ? nodes[sequence[2 * index + 1]]
            : {};

        // @todo: so many questions...
        let rel = relIndex > 0
            ? relations[relIndex - 1]
            : relations[relIndex + relations.length];

        rel = rel || {};

        segments.push({
            start,
            relationship: {
                ...rel,
                start: start.identity,
                end: end.identity
            },
            end
        });

        last = end;
    }

    return {
        start,
        segments,
        end: last
    };
}
