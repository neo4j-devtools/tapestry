import {IConnectionParams} from './connection.class';

import {packRequestData} from './packstream';
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

export function getAuthMessage(protocol: BOLT_PROTOCOLS, params: IConnectionParams) {
    const noFields = 2;
    const data = [
        0xB0 + noFields,
        V1_BOLT_MESSAGES.INIT,
        ...packRequestData(protocol, params.userAgent),
        ...packRequestData(protocol, params.auth)
    ];
    const chunkSize = data.length;

    switch (protocol) {
        default:
            return new Uint8Array([
                chunkSize >> 8,
                chunkSize & 0xFF,
                ...data,
                0,
                0
            ]);
    }
}
