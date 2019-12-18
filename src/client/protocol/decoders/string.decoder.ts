import node from 'buffer';
import {StringDecoder as StringDecoderLib} from 'string_decoder';

import {NodeBuffer, CombinedBuffer} from '../../buffers/index';
import BaseBuffer from '../../buffers/base.buffer';
import UnknownBufferError from '../../../errors/unknown-buffer.error';

const decoder = new StringDecoderLib('utf8');

export default class StringDecoder {
    static encode(str: string): NodeBuffer {
        return new NodeBuffer(newNodeJSBuffer(str));
    }

    static decode(buffer: BaseBuffer<any>, length: number) {
        if (buffer instanceof NodeBuffer) {
            return decodeNodeBuffer(buffer, length);
        }

        if (buffer instanceof CombinedBuffer) {
            return decodeCombinedBuffer(buffer, length);
        }

        throw new UnknownBufferError(`Don't know how to decode strings from '${buffer}'`);
    }
}

function decodeNodeBuffer(buffer: NodeBuffer, length: number) {
    const start = buffer.getBufferPosition();
    const end = start + length;

    buffer.updatePos(Math.min(end, buffer.getBufferLength()));

    // @todo: getOrElse?
    return buffer.getBuffer().toString('utf8', start, end);
}

function decodeCombinedBuffer(buffer: CombinedBuffer, length: number) {
    return streamDecodeCombinedBuffer(
        buffer,
        length,
        (buf: Buffer) => decoder.write(buf),
        () => decoder.end()
    );
}

function streamDecodeCombinedBuffer(
    combinedBuffer: CombinedBuffer,
    length: number,
    decodeFn: (buf: Buffer) => string,
    endFn: () => void
) {
    let remainingBytesToRead = length;
    let position = combinedBuffer.getBufferPosition();

    combinedBuffer.updatePos(
        Math.min(length, combinedBuffer.length - position)
    );

    // Reduce CombinedBuffers to a decoded string
    const out = combinedBuffer.getBuffers().reduce((last, partBuffer) => {
        if (remainingBytesToRead <= 0) {
            return last;
        }
        if (position >= partBuffer.length) {
            position -= partBuffer.length;
            return '';
        }

        partBuffer.updatePos(position - partBuffer.getBufferPosition());

        let bytesToRead = Math.min(
            partBuffer.getBufferLength() - position,
            remainingBytesToRead
        );
        let lastSlice = partBuffer.readSlice(bytesToRead);

        partBuffer.updatePos(bytesToRead);
        remainingBytesToRead = Math.max(
            remainingBytesToRead - lastSlice.getBufferLength(),
            0
        );
        position = 0;

        return last + decodeFn(lastSlice.get());
    }, '');

    return out + endFn();
}

function newNodeJSBuffer(str: string) {
    if (typeof node.Buffer.from === 'function') {
        return node.Buffer.from(str, 'utf8');
    }

    return new node.Buffer(str, 'utf8');
}
