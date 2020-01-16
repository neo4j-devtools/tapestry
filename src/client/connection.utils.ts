import {flatMap} from 'lodash';

import {IConnectionParams} from './connection.class';

import {Packer, packRequestData} from './packstream';
import {BOLT_PROTOCOLS, V1_BOLT_MESSAGES} from './connection.constants';

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

export function createMessage(protocol: BOLT_PROTOCOLS, message: number, requestData: any[], packer?: Packer) {
    const noFields = requestData.length;
    const messageData = [
        0xB0 + noFields,
        message,
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

export function getAuthMessage(protocol: BOLT_PROTOCOLS, params: IConnectionParams, packer?: Packer) {
    return createMessage(
        protocol,
        V1_BOLT_MESSAGES.INIT,
        [params.userAgent, params.auth],
        packer
    );
}

export function getTestMessage(protocol: BOLT_PROTOCOLS, packer?: Packer) {
    return createMessage(
        protocol,
        V1_BOLT_MESSAGES.RUN,
        ['MATCH p=()-[r:FOLLOWS]->() RETURN p', {}],
        packer
    );
}

export function getRetrieveMessage(protocol: BOLT_PROTOCOLS, packer?: Packer) {
    return createMessage(
        protocol,
        V1_BOLT_MESSAGES.PULL_ALL,
        [],
        packer
    );
}

