import CombinedBuffer from './combined.buffer';
import BaseBuffer from './base.buffer';
import {NodeBuffer} from './index';

const CHUNK_HEADER_SIZE = 2;
const MESSAGE_BOUNDARY = 0x00;
const DEFAULT_BUFFER_SIZE = 1400;

/**
 * Looks like a writable buffer, chunks output transparently into a channel below.
 * @access private
 */
class Chunker extends BaseBuffer {
    protected channel: any;
    protected inner: BaseBuffer;
    protected currentChunkStart: number = 0;
    protected chunkOpen: boolean = false;

    constructor(channel: any, protected bufferSize: number = DEFAULT_BUFFER_SIZE) {
        super(0);
        this.channel = channel;
        this.inner = NodeBuffer.of(bufferSize);
        this.currentChunkStart = 0;
        this.chunkOpen = false;
    }

    putUInt8(position, val) {
        this._ensure(1);
        this.inner.writeUInt8(val);
    }

    putInt8(position, val) {
        this._ensure(1);
        this.inner.writeInt8(val);
    }

    putFloat64(position, val) {
        this._ensure(8);
        this.inner.writeFloat64(val);
    }

    putBytes(position, data) {
        // TODO: If data is larger than our chunk size or so, we're very likely better off just passing this buffer on
        // rather than doing the copy here TODO: *however* note that we need some way to find out when the data has been
        // written (and thus the buffer can be re-used) if we take that approach
        while (data.remaining() > 0) {
            // Ensure there is an open chunk, and that it has at least one byte of space left
            this._ensure(1);
            if (this.inner.remaining() > data.remaining()) {
                this.inner.writeBytes(data);
            } else {
                this.inner.writeBytes(data.readSlice(this.inner.remaining()));
            }
        }
        return this;
    }

    flush() {
        if (this.inner.position > 0) {
            this._closeChunkIfOpen();

            // Local copy and clear the buffer field. This ensures that the buffer is not re-released if the flush call fails
            let out = this.inner;
            this.inner = null;

            this.channel.write(out.getSlice(0, out.position));

            // Alloc a new output buffer. We assume we're using NodeJS's buffer pooling under the hood here!
            this.inner = NodeBuffer.of(this.bufferSize);
            this.chunkOpen = false;
        }
        return this;
    }

    /**
     * Bolt messages are encoded in one or more chunks, and the boundary between two messages
     * is encoded as a 0-length chunk, `00 00`. This inserts such a message boundary, closing
     * any currently open chunk as needed
     */
    messageBoundary() {
        this._closeChunkIfOpen();

        if (this.inner.remaining() < CHUNK_HEADER_SIZE) {
            this.flush();
        }

        // Write message boundary
        this.inner.writeInt16(MESSAGE_BOUNDARY);
    }

    /** Ensure at least the given size is available for writing */
    _ensure(size) {
        let toWriteSize = this.chunkOpen ? size : size + CHUNK_HEADER_SIZE;
        if (this.inner.remaining() < toWriteSize) {
            this.flush();
        }

        if (!this.chunkOpen) {
            this.currentChunkStart = this.inner.position;
            this.inner.position = this.inner.position + CHUNK_HEADER_SIZE;
            this.chunkOpen = true;
        }
    }

    _closeChunkIfOpen() {
        if (this.chunkOpen) {
            let chunkSize =
                this.inner.position - (this.currentChunkStart + CHUNK_HEADER_SIZE);
            this.inner.putUInt16(this.currentChunkStart, chunkSize);
            this.chunkOpen = false;
        }
    }
}

export class Dechunker {
    protected currentMessage: BaseBuffer[] = [];
    protected partialChunkHeader = 0;
    protected chunkSize = 0;
    protected state = this.AWAITING_CHUNK;

    constructor(protected readonly onMessage: (message: BaseBuffer) => void) {
    }

    AWAITING_CHUNK(buf: BaseBuffer) {
        if (buf.remaining() >= 2) {
            // Whole header available, read that
            return this.onHeader(buf.readUInt16());
        }

        // Only one byte available, read that and wait for the second byte
        this.partialChunkHeader = buf.readUInt8() << 8;

        return this.IN_HEADER;
    }

    IN_HEADER(buf: BaseBuffer) {
        // First header byte read, now we read the next one
        return this.onHeader((this.partialChunkHeader | buf.readUInt8()) & 0xffff);
    }

    IN_CHUNK(buf: BaseBuffer) {
        if (this.chunkSize <= buf.remaining()) {
            // Current packet is larger than current chunk, or same size:
            this.currentMessage.push(buf.readSlice(this.chunkSize));

            return this.AWAITING_CHUNK;
        }

        // Current packet is smaller than the chunk we're reading, split the current chunk itself up
        this.chunkSize -= buf.remaining();
        this.currentMessage.push(buf.readSlice(buf.remaining()));

        return this.IN_CHUNK;
    }

    CLOSED(_: BaseBuffer) {
        // no-op
    }

    /** Called when a complete chunk header has been received */
    protected onHeader(header: number) {
        if (header === 0) {
            // Message boundary
            const message = this.currentMessage.length === 1
                ? this.currentMessage[0]
                : new CombinedBuffer(this.currentMessage);

            this.currentMessage = [];
            this.onMessage(message);

            return this.AWAITING_CHUNK;
        }

        this.chunkSize = header;
        return this.IN_CHUNK;
    }

    write(buf: BaseBuffer) {
        while (buf.hasRemaining()) {
            this.state = this.state(buf);
        }
    }
}
