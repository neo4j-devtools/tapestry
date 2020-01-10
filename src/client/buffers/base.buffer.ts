import SliceBuffer from './slice.buffer';

export default abstract class BaseBuffer<T extends Buffer = Buffer> {
    protected position: number = 0;

    constructor(public length: number, protected readonly buffer = Buffer.from([])) {}

    abstract getUInt8(position: number): number;

    abstract getInt8(position: number): number;

    abstract getFloat64(position: number): number;

    abstract putUInt8(position: number, val: number): void;

    abstract putInt8(position: number, val: number): void;

    abstract putFloat64(position: number, val: number): void;

    getInt16(position: number) {
        return (this.getInt8(position) << 8) | this.getUInt8(position + 1);
    }

    getUInt16(position: number) {
        return (this.getUInt8(position) << 8) | this.getUInt8(position + 1);
    }

    getInt32(position: number) {
        return (
            (this.getInt8(position) << 24) |
            (this.getUInt8(position + 1) << 16) |
            (this.getUInt8(position + 2) << 8) |
            this.getUInt8(position + 3)
        );
    }

    getUInt32(position: number) {
        return (
            (this.getUInt8(position) << 24) |
            (this.getUInt8(position + 1) << 16) |
            (this.getUInt8(position + 2) << 8) |
            this.getUInt8(position + 3)
        );
    }

    getInt64(position: number) {
        return (
            (this.getInt8(position) << 56) |
            (this.getUInt8(position + 1) << 48) |
            (this.getUInt8(position + 2) << 40) |
            (this.getUInt8(position + 3) << 32) |
            (this.getUInt8(position + 4) << 24) |
            (this.getUInt8(position + 5) << 16) |
            (this.getUInt8(position + 6) << 8) |
            this.getUInt8(position + 7)
        );
    }

    getSlice(start: number, length: number): BaseBuffer<Buffer> {
        return new SliceBuffer(start, length, this);
    }

    putInt16(position: number, val: number) {
        this.putInt8(position, val >> 8);
        this.putUInt8(position + 1, val & 0xff);
    }

    putUInt16(position: number, val: number) {
        this.putUInt8(position, (val >> 8) & 0xff);
        this.putUInt8(position + 1, val & 0xff);
    }

    putInt32(position: number, val: number) {
        this.putInt8(position, val >> 24);
        this.putUInt8(position + 1, (val >> 16) & 0xff);
        this.putUInt8(position + 2, (val >> 8) & 0xff);
        this.putUInt8(position + 3, val & 0xff);
    }

    putUInt32(position: number, val: number) {
        this.putUInt8(position, (val >> 24) & 0xff);
        this.putUInt8(position + 1, (val >> 16) & 0xff);
        this.putUInt8(position + 2, (val >> 8) & 0xff);
        this.putUInt8(position + 3, val & 0xff);
    }

    putInt64(position: number, val: number) {
        this.putInt8(position, val >> 48);
        this.putUInt8(position + 1, (val >> 42) & 0xff);
        this.putUInt8(position + 2, (val >> 36) & 0xff);
        this.putUInt8(position + 3, (val >> 30) & 0xff);
        this.putUInt8(position + 4, (val >> 24) & 0xff);
        this.putUInt8(position + 5, (val >> 16) & 0xff);
        this.putUInt8(position + 6, (val >> 8) & 0xff);
        this.putUInt8(position + 7, val & 0xff);
    }

    putBytes(position: number, other: BaseBuffer<T>) {
        for (let i = 0, end = other.remaining(); i < end; i++) {
            this.putUInt8(position + i, other.readUInt8());
        }
    }

    readUInt8() {
        return this.getUInt8(this.updatePos(1));
    }

    readInt8() {
        return this.getInt8(this.updatePos(1));
    }

    readUInt16() {
        return this.getUInt16(this.updatePos(2));
    }

    readUInt32() {
        return this.getUInt32(this.updatePos(4));
    }

    readInt16() {
        return this.getInt16(this.updatePos(2));
    }

    readInt32() {
        return this.getInt32(this.updatePos(4));
    }

    readInt64() {
        return this.getInt32(this.updatePos(8));
    }

    readFloat64() {
        return this.getFloat64(this.updatePos(8));
    }

    writeUInt8(val: number) {
        this.putUInt8(this.updatePos(1), val);
    }

    writeInt8(val: number) {
        this.putInt8(this.updatePos(1), val);
    }

    writeInt16(val: number) {
        this.putInt16(this.updatePos(2), val);
    }

    writeInt32(val: number) {
        this.putInt32(this.updatePos(4), val);
    }

    writeUInt32(val: number) {
        this.putUInt32(this.updatePos(4), val);
    }

    writeInt64(val: number) {
        this.putInt64(this.updatePos(8), val);
    }

    writeFloat64(val: number) {
        this.putFloat64(this.updatePos(8), val);
    }

    writeBytes(val: BaseBuffer<T>) {
        this.putBytes(this.updatePos(val.remaining()), val);
    }

    readSlice(length: number) {
        return this.getSlice(this.updatePos(length), length);
    }

    updatePos(length: number) {
        let p = this.position;

        this.position += length;

        return p;
    }

    remaining() {
        return this.length - this.position;
    }

    getBuffer() {
        return this.buffer;
    }

    getBufferPosition() {
        return this.position;
    }

    getBufferLength() {
        return this.length;
    }

    /**
     * Has remaining
     */
    hasRemaining() {
        return this.remaining() > 0;
    }

    /**
     * Reset position state
     */
    reset() {
        this.position = 0;
    }

    /**
     * Get string representation of buffer and it's state.
     * @return {string} Buffer as a string
     */
    toString() {
        return (
            this.constructor.name +
            '( position=' +
            this.position +
            ' )\n  ' +
            this.toHex()
        );
    }

    /**
     * Get string representation of buffer.
     * @return {string} Buffer as a string
     */
    toHex() {
        let out = '';
        for (let i = 0; i < this.length; i++) {
            let hexByte = this.getUInt8(i).toString(16);
            if (hexByte.length === 1) {
                hexByte = '0' + hexByte;
            }
            out += hexByte;
            if (i !== this.length - 1) {
                out += ' ';
            }
        }
        return out;
    }
}
