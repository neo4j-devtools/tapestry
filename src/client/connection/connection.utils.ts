import {flatMap} from 'lodash';

import {IConnectionConfig} from '../types';

import {Packer, packRequestData} from '../packstream/index';
import {BOLT_PROTOCOLS, V1_BOLT_MESSAGES} from './connection.constants';
import {DRIVER_COMMANDS} from '../driver/driver.constants';

export function joinArrayBuffers(buf1: ArrayBuffer, buf2: ArrayBuffer): ArrayBuffer {
    const byteLength = buf1.byteLength + buf2.byteLength;
    const out = new ArrayBuffer(byteLength);
    const outArray = new Uint8Array(out);

    outArray.set(new Uint8Array(buf1), 0);
    outArray.set(new Uint8Array(buf2), buf1.byteLength);

    return out;
}

export function getHandshakeMessage() {
    return new Uint8Array([
        0x60, 0x60, 0xB0, 0x17,
        0x00, 0x00, 0x00, 0x02,
        0x00, 0x00, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00
    ]);
}

function getCommandForProtocol(protocol: BOLT_PROTOCOLS, cmd: DRIVER_COMMANDS): number {
    switch (protocol) {
        case BOLT_PROTOCOLS.V1:
        default: {
            return V1_BOLT_MESSAGES[cmd];
        }
    }
}

export function createMessage<T extends any = any>(protocol: BOLT_PROTOCOLS, cmd: DRIVER_COMMANDS, requestData: any[], packer?: Packer<T>) {
    const noFields = requestData.length;
    const messageData = [
        0xB0 + noFields,
        getCommandForProtocol(protocol, cmd),
        ...flatMap(requestData, (data) => packRequestData(protocol, data, packer))
    ];
    const chunkSize = messageData.length;

    switch (protocol) {
        default:
            return new Uint8Array([
                chunkSize >> 8,
                chunkSize & 0xFF,
                ...messageData,
                0,
                0
            ]);
    }
}

export function getAuthMessage<T extends any = any>(protocol: BOLT_PROTOCOLS, params: IConnectionConfig<any>, packer?: Packer<T>) {
    return createMessage(
        protocol,
        DRIVER_COMMANDS.INIT,
        [params.userAgent, params.auth],
        packer
    );
}
