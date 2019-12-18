import autobind from 'autobind-decorator';

import {StringDecoder} from '../decoders';
import {
    Num,
    Node,
    Path,
    PathSegment,
    Relationship,
    UnboundRelationship, None
} from '../../../monads';
import BaseBuffer from '../../buffers/base.buffer';
import ProtocolError from '../../../errors/protocol.error';
import {
    BYTES_16,
    BYTES_32,
    BYTES_8,
    FALSE,
    FLOAT_64,
    INT_16,
    INT_32,
    INT_64,
    INT_8,
    LIST_16,
    LIST_32,
    LIST_8,
    MAP_16,
    MAP_32,
    MAP_8,
    NULL,
    RELATIONSHIP,
    STRING_16,
    STRING_32,
    STRING_8,
    STRUCT_16,
    STRUCT_8,
    TINY_LIST,
    TINY_MAP,
    TINY_STRING,
    TINY_STRUCT,
    TRUE,
    NODE,
    UNBOUND_RELATIONSHIP,
    NODE_STRUCT_SIZE,
    RELATIONSHIP_STRUCT_SIZE,
    PATH,
    UNBOUND_RELATIONSHIP_STRUCT_SIZE,
    PATH_STRUCT_SIZE
} from './packer.constants';
import Structure from './structure.class';

/**
 * Class to pack
 * @access private
 */
export class Packer {
    constructor(protected channel: BaseBuffer, protected byteArraysSupported: boolean = true) {
    }

    @autobind
    packable(x: any): () => void {
        if (x === null) {
            return () => this.channel.writeUInt8(NULL);
        }

        if (x === true) {
            return () => this.channel.writeUInt8(TRUE);
        }

        if (x === false) {
            return () => this.channel.writeUInt8(FALSE);
        }

        if (typeof x === 'number') {
            return () => this.packFloat(x);
        }

        if (typeof x === 'string') {
            return () => this.packString(x);
        }

        if (Num.isNum(x)) {
            return () => this.packInteger(x);
        }

        if (x instanceof Int8Array) {
            return () => this.packBytes(x);
        }

        if (x instanceof Array) {
            return () => {
                this.packListHeader(x.length);

                for (let i = 0; i < x.length; i++) {
                    this.packable(x[i] === undefined ? null : x[i])();
                }
            };
        }

        if (x instanceof Node) {
            return this.nonPackableValue(
                `It is not allowed to pass nodes in query parameters, given: ${x}`
            );
        }

        if (x instanceof Relationship) {
            return this.nonPackableValue(
                `It is not allowed to pass relationships in query parameters, given: ${x}`
            );
        }

        if (x instanceof Path) {
            return this.nonPackableValue(
                `It is not allowed to pass paths in query parameters, given: ${x}`
            );
        }

        if (x instanceof Structure) {
            const packableFields = x.fields.map(this.packable);

            return () => this.packStruct(x.signature, packableFields);
        }

        // monads are iterable
        if (isIterable(x)) {
            return this.packableIterable(x);
        }

        if (typeof x === 'object') {
            return () => {
                let keys = Object.keys(x);

                let count = 0;
                for (let i = 0; i < keys.length; i++) {
                    if (x[keys[i]] !== undefined) {
                        count++;
                    }
                }

                this.packMapHeader(count);

                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    if (x[key] !== undefined) {
                        this.packString(key);
                        this.packable(x[key])();
                    }
                }
            };
        }

        return this.nonPackableValue(`Unable to pack the given value: ${x}`);
    }

    packableIterable(iterable: Iterable<any>) {
        try {
            const array = Array.from(iterable);

            return this.packable(array);
        } catch (e) {
            // handle errors from iterable to array conversion
            throw new ProtocolError(`Cannot pack given iterable, ${e.message}: ${iterable}`);
        }
    }


    packStruct(signature: number, packableFields: any[]) {
        packableFields = packableFields || [];

        this.packStructHeader(packableFields.length, signature);

        for (let i = 0; i < packableFields.length; i++) {
            packableFields[i]();
        }
    }

    packInteger(x: Num) {
        const high = x.getHigh();
        const low = x.getLow();

        if (x.greaterThanOrEqual(-0x10) && x.lessThan(0x80)) {
            this.channel.writeInt8(low);

            return;
        }

        if (x.greaterThanOrEqual(-0x80) && x.lessThan(-0x10)) {
            this.channel.writeUInt8(INT_8);
            this.channel.writeInt8(low);

            return;
        }

        if (x.greaterThanOrEqual(-0x8000) && x.lessThan(0x8000)) {
            this.channel.writeUInt8(INT_16);
            this.channel.writeInt16(low);

            return;
        }

        if (x.greaterThanOrEqual(-0x80000000) && x.lessThan(0x80000000)) {
            this.channel.writeUInt8(INT_32);
            this.channel.writeInt32(low);

            return;
        }

        this.channel.writeUInt8(INT_64);
        this.channel.writeInt32(high);
        this.channel.writeInt32(low);

        return;
    }

    packFloat(x: number) {
        this.channel.writeUInt8(FLOAT_64);
        this.channel.writeFloat64(x);
    }

    packString(x: string) {
        const bytes = StringDecoder.encode(x);
        const size = bytes.length;

        if (size < 0x10) {
            this.channel.writeUInt8(TINY_STRING | size);
            this.channel.writeBytes(bytes);

            return;
        }

        if (size < 0x100) {
            this.channel.writeUInt8(STRING_8);
            this.channel.writeUInt8(size);
            this.channel.writeBytes(bytes);

            return;
        }

        if (size < 0x10000) {
            this.channel.writeUInt8(STRING_16);
            this.channel.writeUInt8((size / 256) >> 0);
            this.channel.writeUInt8(size % 256);
            this.channel.writeBytes(bytes);

            return;
        }

        if (size < 0x100000000) {
            this.channel.writeUInt8(STRING_32);
            this.channel.writeUInt8(((size / 16777216) >> 0) % 256);
            this.channel.writeUInt8(((size / 65536) >> 0) % 256);
            this.channel.writeUInt8(((size / 256) >> 0) % 256);
            this.channel.writeUInt8(size % 256);
            this.channel.writeBytes(bytes);

            return;
        }

        throw new ProtocolError('UTF-8 strings of size ' + size + ' are not supported');
    }

    packListHeader(size: number) {
        if (size < 0x10) {
            this.channel.writeUInt8(TINY_LIST | size);

            return;
        }

        if (size < 0x100) {
            this.channel.writeUInt8(LIST_8);
            this.channel.writeUInt8(size);

            return;
        }

        if (size < 0x10000) {
            this.channel.writeUInt8(LIST_16);
            this.channel.writeUInt8(((size / 256) >> 0) % 256);
            this.channel.writeUInt8(size % 256);

            return;
        }

        if (size < 0x100000000) {
            this.channel.writeUInt8(LIST_32);
            this.channel.writeUInt8(((size / 16777216) >> 0) % 256);
            this.channel.writeUInt8(((size / 65536) >> 0) % 256);
            this.channel.writeUInt8(((size / 256) >> 0) % 256);
            this.channel.writeUInt8(size % 256);

            return;
        }

        throw new ProtocolError('Lists of size ' + size + ' are not supported');
    }

    packBytes(array: Int8Array) {
        if (this.byteArraysSupported) {
            this.packBytesHeader(array.length);

            for (let i = 0; i < array.length; i++) {
                this.channel.writeInt8(array[i]);
            }

            return;
        }

        throw new ProtocolError(
            'Byte arrays are not supported by the database this driver is connected to'
        );
    }

    packBytesHeader(size: number) {
        if (size < 0x100) {
            this.channel.writeUInt8(BYTES_8);
            this.channel.writeUInt8(size);

            return;
        }

        if (size < 0x10000) {
            this.channel.writeUInt8(BYTES_16);
            this.channel.writeUInt8(((size / 256) >> 0) % 256);
            this.channel.writeUInt8(size % 256);

            return;
        }

        if (size < 0x100000000) {
            this.channel.writeUInt8(BYTES_32);
            this.channel.writeUInt8(((size / 16777216) >> 0) % 256);
            this.channel.writeUInt8(((size / 65536) >> 0) % 256);
            this.channel.writeUInt8(((size / 256) >> 0) % 256);
            this.channel.writeUInt8(size % 256);

            return;
        }

        throw new ProtocolError('Byte arrays of size ' + size + ' are not supported');
    }

    packMapHeader(size: number) {
        if (size < 0x10) {
            this.channel.writeUInt8(TINY_MAP | size);

            return;
        }

        if (size < 0x100) {
            this.channel.writeUInt8(MAP_8);
            this.channel.writeUInt8(size);

            return;
        }

        if (size < 0x10000) {
            this.channel.writeUInt8(MAP_16);
            this.channel.writeUInt8((size / 256) >> 0);
            this.channel.writeUInt8(size % 256);

            return;
        }

        if (size < 0x100000000) {
            this.channel.writeUInt8(MAP_32);
            this.channel.writeUInt8(((size / 16777216) >> 0) % 256);
            this.channel.writeUInt8(((size / 65536) >> 0) % 256);
            this.channel.writeUInt8(((size / 256) >> 0) % 256);
            this.channel.writeUInt8(size % 256);

            return;
        }

        throw new ProtocolError('Maps of size ' + size + ' are not supported');
    }

    packStructHeader(size: number, signature: number) {
        if (size < 0x10) {
            this.channel.writeUInt8(TINY_STRUCT | size);
            this.channel.writeUInt8(signature);

            return;
        }

        if (size < 0x100) {
            this.channel.writeUInt8(STRUCT_8);
            this.channel.writeUInt8(size);
            this.channel.writeUInt8(signature);

            return;
        }

        if (size < 0x10000) {
            this.channel.writeUInt8(STRUCT_16);
            this.channel.writeUInt8((size / 256) >> 0);
            this.channel.writeUInt8(size % 256);

            return;
        }

        throw new ProtocolError('Structures of size ' + size + ' are not supported');
    }

    disableByteArrays() {
        this.byteArraysSupported = false;
    }

    protected nonPackableValue(message: string) {
        return () => {
            throw new ProtocolError(message);
        };
    }
}

/**
 * Class to unpack
 * @access private
 */
export class Unpacker {
    constructor(protected disableLosslessIntegers: boolean = false) {
    }

    unpack(buffer: BaseBuffer): any {
        const marker = buffer.readUInt8();
        const markerHigh = marker & 0xf0;
        const markerLow = marker & 0x0f;

        if (marker === NULL) {
            return null;
        }

        const boolean = this.unpackBoolean(marker);

        if (boolean !== null) {
            return boolean;
        }

        const numberOrInteger = this.unpackNumberOrInteger(marker, buffer);

        if (Num.isNum(numberOrInteger)) {
            if (this.disableLosslessIntegers && Num.isNum(numberOrInteger)) {
                return numberOrInteger.toNumberOrInfinity();
            }

            return numberOrInteger;
        }

        const string = this.unpackString(marker, markerHigh, markerLow, buffer);

        if (string !== null) {
            return string;
        }

        const list = this.unpackList(marker, markerHigh, markerLow, buffer);

        if (list !== null) {
            return list;
        }

        const byteArray = this.unpackByteArray(marker, buffer);

        if (byteArray !== null) {
            return byteArray;
        }

        const map = this.unpackMap(marker, markerHigh, markerLow, buffer);

        if (map !== null) {
            return map;
        }

        const struct = this.unpackStruct(marker, markerHigh, markerLow, buffer);

        if (struct !== null) {
            return struct;
        }

        throw new ProtocolError('Unknown packed value with marker ' + marker.toString(16));
    }

    unpackIntegerBuffer(buffer: BaseBuffer) {
        const marker = buffer.readUInt8();
        const result = this.unpackInteger(marker, buffer);

        if (None.isNone(result)) {
            throw new ProtocolError(
                'Unable to unpack integer value with marker ' + marker.toString(16)
            );
        }

        return result;
    }

    protected unpackBoolean(marker: number) {
        if (marker === TRUE) {
            return true;
        } else if (marker === FALSE) {
            return false;
        } else {
            return null;
        }
    }

    protected unpackNumberOrInteger(marker: number, buffer: BaseBuffer) {
        if (marker === FLOAT_64) {
            return Num.fromValue(buffer.readFloat64());
        } else {
            return this.unpackInteger(marker, buffer);
        }
    }

    protected unpackInteger(marker: number, buffer: BaseBuffer) {
        if (marker >= 0 && marker < 128) {
            return Num.fromValue(marker);
        }

        if (marker >= 240 && marker < 256) {
            return Num.fromValue(marker - 256);
        }

        if (marker === INT_8) {
            return Num.fromValue(buffer.readInt8());
        }

        if (marker === INT_16) {
            return Num.fromValue(buffer.readInt16());
        }

        if (marker === INT_32) {
            const b = buffer.readInt32();

            return Num.fromValue(b);
        }

        if (marker === INT_64) {
            const high = buffer.readInt32();
            const low = buffer.readInt32();

            return new Num(low, high);
        }

        return None.of();
    }

    protected unpackString(marker: number, markerHigh: number, markerLow: number, buffer: BaseBuffer) {
        if (markerHigh === TINY_STRING) {
            return StringDecoder.decode(buffer, markerLow);
        }

        if (marker === STRING_8) {
            return StringDecoder.decode(buffer, buffer.readUInt8());
        }

        if (marker === STRING_16) {
            return StringDecoder.decode(buffer, buffer.readUInt16());
        }

        if (marker === STRING_32) {
            return StringDecoder.decode(buffer, buffer.readUInt32());
        }

        return null;
    }

    protected unpackList(marker: number, markerHigh: number, markerLow: number, buffer: BaseBuffer) {
        if (markerHigh === TINY_LIST) {
            return this.unpackListWithSize(markerLow, buffer);
        }

        if (marker === LIST_8) {
            return this.unpackListWithSize(buffer.readUInt8(), buffer);
        }

        if (marker === LIST_16) {
            return this.unpackListWithSize(buffer.readUInt16(), buffer);
        }

        if (marker === LIST_32) {
            return this.unpackListWithSize(buffer.readUInt32(), buffer);
        }

        return null;
    }

    protected unpackListWithSize(size: number, buffer: BaseBuffer) {
        let value = [];

        for (let i = 0; i < size; i++) {
            value.push(this.unpack(buffer));
        }

        return value;
    }

    protected unpackByteArray(marker: number, buffer: BaseBuffer) {
        if (marker === BYTES_8) {
            return this.unpackByteArrayWithSize(buffer.readUInt8(), buffer);
        }

        if (marker === BYTES_16) {
            return this.unpackByteArrayWithSize(buffer.readUInt16(), buffer);
        }

        if (marker === BYTES_32) {
            return this.unpackByteArrayWithSize(buffer.readUInt32(), buffer);
        }

        return null;
    }

    protected unpackByteArrayWithSize(size: number, buffer: BaseBuffer) {
        const value = new Int8Array(size);

        for (let i = 0; i < size; i++) {
            value[i] = buffer.readInt8();
        }

        return value;
    }

    protected unpackMap(marker: number, markerHigh: number, markerLow: number, buffer: BaseBuffer) {
        if (markerHigh === TINY_MAP) {
            return this.unpackMapWithSize(markerLow, buffer);
        }

        if (marker === MAP_8) {
            return this.unpackMapWithSize(buffer.readUInt8(), buffer);
        }

        if (marker === MAP_16) {
            return this.unpackMapWithSize(buffer.readUInt16(), buffer);
        }

        if (marker === MAP_32) {
            return this.unpackMapWithSize(buffer.readUInt32(), buffer);
        }

        return null;
    }

    protected unpackMapWithSize(size: number, buffer: BaseBuffer) {
        let value: any = {};

        for (let i = 0; i < size; i++) {
            const key = this.unpack(buffer);

            value[key] = this.unpack(buffer);
        }

        return value;
    }

    protected unpackStruct(marker: number, markerHigh: number, markerLow: number, buffer: BaseBuffer) {
        if (markerHigh === TINY_STRUCT) {
            return this.unpackStructWithSize(markerLow, buffer);
        }

        if (marker === STRUCT_8) {
            return this.unpackStructWithSize(buffer.readUInt8(), buffer);
        }

        if (marker === STRUCT_16) {
            return this.unpackStructWithSize(buffer.readUInt16(), buffer);
        }

        return null;
    }

    protected unpackStructWithSize(structSize: number, buffer: BaseBuffer) {
        const signature = buffer.readUInt8();

        if (signature === NODE) {
            return this.unpackNode(structSize, buffer);
        }

        if (signature === RELATIONSHIP) {
            return this.unpackRelationship(structSize, buffer);
        }

        if (signature === UNBOUND_RELATIONSHIP) {
            return this.unpackUnboundRelationship(structSize, buffer);
        }

        if (signature === PATH) {
            return this.unpackPath(structSize, buffer);
        }

        return this.unpackUnknownStruct(signature, structSize, buffer);
    }

    protected unpackNode(structSize: number, buffer: BaseBuffer): Node {
        this.verifyStructSize('Node', NODE_STRUCT_SIZE, structSize);

        return Node.of({
            identity: this.unpack(buffer),
            labels: this.unpack(buffer),
            properties: this.unpack(buffer)
        });
    }

    protected unpackRelationship(structSize: number, buffer: BaseBuffer): Relationship {
        this.verifyStructSize('Relationship', RELATIONSHIP_STRUCT_SIZE, structSize);

        return Relationship.of({
            identity: this.unpack(buffer),
            start: this.unpack(buffer),
            end: this.unpack(buffer),
            type: this.unpack(buffer),
            properties: this.unpack(buffer)
        });
    }

    protected unpackUnboundRelationship(structSize: number, buffer: BaseBuffer): UnboundRelationship {
        this.verifyStructSize(
            'UnboundRelationship',
            UNBOUND_RELATIONSHIP_STRUCT_SIZE,
            structSize
        );

        return UnboundRelationship.of({
            identity: this.unpack(buffer),
            type: this.unpack(buffer),
            properties: this.unpack(buffer)
        });
    }

    protected unpackPath(structSize: number, buffer: BaseBuffer): Path {
        this.verifyStructSize('Path', PATH_STRUCT_SIZE, structSize);

        const nodes: Node[] = this.unpack(buffer);
        const rels: Relationship[] = this.unpack(buffer);
        const sequence: any[] = this.unpack(buffer);
        const segments = [];
        let prevNode = nodes[0];

        for (let i = 0; i < sequence.length; i += 2) {
            const nextNode = nodes[sequence[i + 1]];
            let relIndex = sequence[i];
            let rel;

            if (relIndex > 0) {
                rel = rels[relIndex - 1];

                if (rel instanceof UnboundRelationship) {
                    // To avoid duplication, relationships in a path do not contain
                    // information about their start and end nodes, that's instead
                    // inferred from the path sequence. This is us inferring (and,
                    // for performance reasons remembering) the start/end of a rel.
                    rels[relIndex - 1] = rel = rel.bind(
                        prevNode.getIdentity(),
                        nextNode.getIdentity()
                    );
                }
            } else {
                rel = rels[-relIndex - 1];

                if (rel instanceof UnboundRelationship) {
                    // See above
                    rels[-relIndex - 1] = rel = rel.bind(
                        nextNode.getIdentity(),
                        prevNode.getIdentity()
                    );
                }
            }

            // Done hydrating one path segment.
            segments.push(new PathSegment({
                start: prevNode,
                relationship: rel,
                end: nextNode
            }));

            prevNode = nextNode;
        }

        return new Path({
            start: nodes[0],
            end: nodes[nodes.length - 1],
            segments
        });
    }

    protected unpackUnknownStruct(signature: number, structSize: number, buffer: BaseBuffer): Structure {
        const result = new Structure(signature, []);

        for (let i = 0; i < structSize; i++) {
            result.fields.push(this.unpack(buffer));
        }

        return result;
    }

    verifyStructSize(structName: string, expectedSize: number, actualSize: number) {
        if (expectedSize !== actualSize) {
            throw new ProtocolError(
                `Wrong struct size for ${structName}, expected ${expectedSize} but was ${actualSize}`
            );
        }
    }
}

function isIterable(obj: any) {
    if (obj == null) {
        return false;
    }

    return typeof obj[Symbol.iterator] === 'function';
}
