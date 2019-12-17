import {NodeBuffer} from '../buffers';
import {BOLT_MAGIC_PREAMBLE, HTTP_MAGIC_PREAMBLE} from './protocol.constants';
import BaseBuffer from '../buffers/base.buffer';
import {UnknownProtocolError, BadRequestError} from '../../errors/index';

export function createHandshakeBuffer(): Buffer {
    const handshakeBuffer = NodeBuffer.of(5 * 4);

    // magic preamble
    handshakeBuffer.writeInt32(BOLT_MAGIC_PREAMBLE);

    // proposed versions
    handshakeBuffer.writeInt32(4);
    handshakeBuffer.writeInt32(3);
    handshakeBuffer.writeInt32(2);
    handshakeBuffer.writeInt32(1);

    // reset the reader position
    handshakeBuffer.reset();

    return handshakeBuffer.getBuffer();
}

export function createNegotiatedProtocol(buffer: BaseBuffer<Buffer>) {
    const negotiatedVersion = buffer.readInt32();

    switch (negotiatedVersion) {
        case 1:
            return new BoltProtocolV1(
                this._connection,
                this._chunker,
                this._disableLosslessIntegers
            );
        case 2:
            return new BoltProtocolV2(
                this._connection,
                this._chunker,
                this._disableLosslessIntegers
            );
        case 3:
            return new BoltProtocolV3(
                this._connection,
                this._chunker,
                this._disableLosslessIntegers
            );
        case 4:
            return new BoltProtocolV4(
                this._connection,
                this._chunker,
                this._disableLosslessIntegers
            );
        case HTTP_MAGIC_PREAMBLE:
            throw new BadRequestError(
                'Server responded HTTP. Make sure you are not trying to connect to the http endpoint ' +
                '(HTTP defaults to port 7474 whereas BOLT defaults to port 7687)'
            );
        default:
            throw new UnknownProtocolError('Unknown Bolt protocol version: ' + negotiatedVersion);
    }
}
