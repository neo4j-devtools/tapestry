import node from 'buffer';

import BaseBuffer from './base.buffer';
import {isNumber} from '../../utils/number.utils';
import {isFunction} from '../../utils/functions.utils';

export default class NodeBuffer extends BaseBuffer {
    static isNodeBuffer(val: any): val is NodeBuffer {
        return val instanceof NodeBuffer;
    }

    static of(arg: any) {
        if (arg instanceof node.Buffer) {
            return new NodeBuffer(arg);
        }

        if (isNumber(arg) && isFunction(node.Buffer.alloc)) {
            return new NodeBuffer(node.Buffer.alloc(arg));
        }

        return new NodeBuffer(new node.Buffer(arg));
    }

    constructor(protected readonly buffer: Buffer) {
        super(buffer.length, buffer);
    }

    getBuffer() {
        return this.buffer
    }

    getUInt8(position: number) {
        return this.buffer.readUInt8(position);
    }

    getInt8(position: number) {
        return this.buffer.readInt8(position);
    }

    getFloat64(position: number) {
        return this.buffer.readDoubleBE(position);
    }

    putUInt8(position: number, val: number) {
        this.buffer.writeUInt8(val, position);
    }

    putInt8(position: number, val: number) {
        this.buffer.writeInt8(val, position);
    }

    putFloat64(position: number, val: number) {
        this.buffer.writeDoubleBE(val, position);
    }

    putBytes(position: number, val: BaseBuffer) {
        if (!(val instanceof NodeBuffer)) {
            super.putBytes(position, val);
            return;
        }

        const bytesToCopy = Math.min(
            val.getBufferLength() - val.getBufferPosition(),
            this.getBufferLength() - position
        );

        val.buffer.copy(
            this.buffer,
            position,
            val.getBufferPosition(),
            val.getBufferPosition() + bytesToCopy
        );

        val.position += bytesToCopy;
    }

    getSlice(start: number, length: number) {
        return new NodeBuffer(this.buffer.slice(start, start + length));
    }
}
