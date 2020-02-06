import {has, flatMap} from 'lodash';

import {DriverCommand, IConnectionConfig, Packer} from '../types';

import {HEADER_SIZE_LIMITS, packRequestData} from '../packstream';
import {
    BOLT_MAGIC_PREAMBLE,
    BOLT_PROTOCOLS,
    V1_BOLT_MESSAGES,
    V2_BOLT_MESSAGES,
    V3_BOLT_MESSAGES,
    V4_BOLT_MESSAGES
} from './connection.constants';
import {DRIVER_QUERY_COMMANDS, DRIVER_TRANSACTION_COMMANDS} from '../driver';
import InvalidOperationError from '../errors/invalid-operation.error';

export function joinArrayBuffers(buf1: ArrayBuffer, buf2: ArrayBuffer): ArrayBuffer {
    const byteLength = buf1.byteLength + buf2.byteLength;
    const out = new ArrayBuffer(byteLength);
    const outArray = new Uint8Array(out);

    outArray.set(new Uint8Array(buf1), 0);
    outArray.set(new Uint8Array(buf2), buf1.byteLength);

    return out;
}

export function getHandshakeMessage() {
    const handshakeBuffer = Buffer.alloc(5 * 4);
    let pos = 0;

    // magic preamble
    pos = writeInt32(handshakeBuffer, pos, BOLT_MAGIC_PREAMBLE);

    // proposed versions
    pos = writeInt32(handshakeBuffer, pos, 4);
    pos = writeInt32(handshakeBuffer, pos, 3);
    pos = writeInt32(handshakeBuffer, pos, 2);
    writeInt32(handshakeBuffer, pos, 1);

    return handshakeBuffer;
}

function writeInt32(buffer: Buffer, pos: number, val: number) {
    buffer.writeInt8(val >> 24, pos);
    buffer.writeUInt8((val >> 16) & 0xff, pos + 1);
    buffer.writeUInt8((val >> 8) & 0xff, pos + 2);
    buffer.writeUInt8(val & 0xff, pos + 3);

    return pos + 4;
}

function getCommandForProtocol(protocol: BOLT_PROTOCOLS, cmd: DriverCommand): number {
    if (has(DRIVER_TRANSACTION_COMMANDS, cmd)) {
        switch (protocol) {
            case BOLT_PROTOCOLS.V4:
                return V4_BOLT_MESSAGES[cmd];

            case BOLT_PROTOCOLS.V3:
                return V3_BOLT_MESSAGES[cmd];

            default: {
                throw new InvalidOperationError(`Protocol ${protocol} does not support transactions`)
            }
        }
    }

    switch (protocol) {
        case BOLT_PROTOCOLS.V4:
            return V4_BOLT_MESSAGES[cmd];

        case BOLT_PROTOCOLS.V3:
            return V3_BOLT_MESSAGES[cmd];

        case BOLT_PROTOCOLS.V2:
            // @ts-ignore
            return V2_BOLT_MESSAGES[cmd];

        case BOLT_PROTOCOLS.V1:
        default: {
            // @ts-ignore
            return V1_BOLT_MESSAGES[cmd];
        }
    }
}

export function createMessage<T extends any = any>(protocol: BOLT_PROTOCOLS, cmd: DriverCommand, requestData: any[], packer?: Packer<T>) {
    const noFields = requestData.length;
    const messageCmd = getCommandForProtocol(protocol, cmd);
    const messageData = flatMap(requestData, (data) => packRequestData(protocol, data, packer));
    const headers = getMessageHeader(noFields, messageCmd);
    const chunkSize = headers.length + messageData.length;

    switch (protocol) {
        default:
            return new Uint8Array([
                chunkSize >> 8,
                chunkSize & 0xFF,
                ...headers,
                ...messageData,
                0,
                0
            ]);
    }
}

function getMessageHeader(size: number, signature: number) {
    if (size < 0x10) {
        return [HEADER_SIZE_LIMITS.TINY_STRUCT | size, signature]
    }

    throw new Error('Messages of size ' + size + ' are not supported')
}

export function getAuthMessage<T extends any = any>(protocol: BOLT_PROTOCOLS, params: IConnectionConfig<any>, packer?: Packer<T>) {
    const authParams = protocol >= BOLT_PROTOCOLS.V3
        ? [{user_agent: params.userAgent, ...params.authToken}]
        : [params.userAgent, params.authToken];

    return createMessage(
        protocol,
        DRIVER_QUERY_COMMANDS.HELLO,
        authParams,
        packer
    );
}
