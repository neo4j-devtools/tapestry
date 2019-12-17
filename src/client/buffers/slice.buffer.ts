import BaseBuffer from './base.buffer';

/**
 * Represents a view as slice of another buffer.
 * @access private
 */
export default class SliceBuffer extends BaseBuffer {
    constructor (protected start: number, public length: number, protected inner: BaseBuffer) {
        super(length)
    }

    getInner() {
        return this.inner
    }

    putUInt8 (position: number, val: number) {
        this.inner.putUInt8(this.start + position, val)
    }

    getUInt8 (position: number) {
        return this.inner.getUInt8(this.start + position)
    }

    putInt8 (position: number, val: number) {
        this.inner.putInt8(this.start + position, val)
    }

    putFloat64 (position: number, val: number) {
        this.inner.putFloat64(this.start + position, val)
    }

    getInt8 (position: number) {
        return this.inner.getInt8(this.start + position)
    }

    getFloat64 (position: number) {
        return this.inner.getFloat64(this.start + position)
    }
}
