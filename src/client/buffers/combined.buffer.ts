import BaseBuffer from './base.buffer';
import NodeBuffer from './node.buffer';

export default class CombinedBuffer extends BaseBuffer {
    static isCombinedBuffer(val: any): val is CombinedBuffer {
        return val instanceof CombinedBuffer;
    }

    protected readonly buffers: BaseBuffer[];

    constructor(buffers: BaseBuffer[]) {
        let length = 0;

        for (let i = 0; i < buffers.length; i++) {
            length += buffers[i].getBufferLength();
        }

        super(length);
        this.buffers = buffers;
    }

    getBuffers() {
        return this.buffers
    }

    getUInt8(position: number) {
        // Surely there's a faster way to do this.. some sort of lookup table thing?
        for (let i = 0; i < this.buffers.length; i++) {
            const buffer = this.buffers[i];

            // If the position is not in the current buffer, skip the current buffer
            if (position >= buffer.getBufferLength()) {
                position -= buffer.getBufferLength();
            } else {
                return buffer.getUInt8(position);
            }
        }

        // @todo: щ（ﾟДﾟщ）
        return NaN;
    }

    getInt8(position: number) {
        // Surely there's a faster way to do this.. some sort of lookup table thing?
        for (let i = 0; i < this.buffers.length; i++) {
            const buffer = this.buffers[i];

            // If the position is not in the current buffer, skip the current buffer
            if (position >= buffer.getBufferLength()) {
                position -= buffer.getBufferLength();
            } else {
                return buffer.getInt8(position);
            }
        }

        // @todo: щ（ﾟДﾟщ）
        return NaN;
    }

    getFloat64(position: number) {
        // At some point, a more efficient impl. For now, we copy the 8 bytes
        // we want to read and depend on the platform impl of IEEE 754.
        const b = NodeBuffer.of(8);

        for (let i = 0; i < 8; i++) {
            b.putUInt8(i, this.getUInt8(position + i));
        }

        return b.getFloat64(0);
    }

    putUInt8 () {
        throw new Error('Not implemented')
    }

    putInt8 () {
        throw new Error('Not implemented')
    }

    putFloat64 () {
        throw new Error('Not implemented')
    }
}
