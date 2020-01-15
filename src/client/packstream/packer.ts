import {entries, flatMap, take} from 'lodash';

import {BOLT_PROTOCOLS} from '../connection.constants';
import {BOLT_REQUEST_DATA_TYPE} from './packer.constants';

export enum HEADER_SIZE_LIMITS {
    TINY_ARRAY = 0x90,
    MEDIUM_ARRAY = 0xD5,
    LARGE_ARRAY = 0xD6,
    TINY_STRING = 0x80,
    MEDIUM_STRING = 0xD1,
    LARGE_STRING = 0xD2,
    TINY_OBJECT = 0xA0,
    MEDIUM_OBJECT = 0xD9,
    LARGE_OBJECT = 0xDA
}
export const MAX_HEADER_SIZE = 0x7FFFFFFF;
export const BOOLEAN_TRUE_BYTES = 0xB3;
export const BOOLEAN_FALSE_BYTES = 0xB2;
export const NULL_BYTES = 0xC0;

export function packRequestData(protocol: BOLT_PROTOCOLS, data: any, packer = defaultPacker) {
    if (Array.isArray(data)) {
        return packer(protocol, BOLT_REQUEST_DATA_TYPE.ARRAY, data);
    }

    switch (typeof data) {
        case BOLT_REQUEST_DATA_TYPE.BOOLEAN: {
            return packer(protocol, BOLT_REQUEST_DATA_TYPE.BOOLEAN, data);
        }

        case BOLT_REQUEST_DATA_TYPE.NUMBER: {
            return packer(protocol, BOLT_REQUEST_DATA_TYPE.NUMBER, data);
        }

        case BOLT_REQUEST_DATA_TYPE.STRING: {
            return packer(protocol, BOLT_REQUEST_DATA_TYPE.STRING, data);
        }

        case BOLT_REQUEST_DATA_TYPE.OBJECT: {
            return packer(protocol, BOLT_REQUEST_DATA_TYPE.OBJECT, data);
        }

        default: {
            return packer(protocol, BOLT_REQUEST_DATA_TYPE.UNKNOWN, data);
        }
    }
}

function defaultPacker(protocol: BOLT_PROTOCOLS, dataType: BOLT_REQUEST_DATA_TYPE, data: any): number[] {
    switch (dataType) {
        case BOLT_REQUEST_DATA_TYPE.ARRAY: {
            const {size, headers} = packHeader(
                data.length,
                HEADER_SIZE_LIMITS.TINY_ARRAY,
                HEADER_SIZE_LIMITS.MEDIUM_ARRAY,
                HEADER_SIZE_LIMITS.LARGE_ARRAY
            );

            return [...headers, ...flatMap(take(data, size), (chunk) => packRequestData(protocol, chunk, packRequestData))];
        }

        case 'boolean': {
            return [data ? BOOLEAN_TRUE_BYTES : BOOLEAN_FALSE_BYTES];
        }

        case 'number': {
            return (data % 1 === 0) ? packInt(data) : packFloat(data);
        }

        case 'string': {
            const bytes = packString(data);
            const {size, headers} = packHeader(
                bytes.length,
                HEADER_SIZE_LIMITS.TINY_STRING,
                HEADER_SIZE_LIMITS.MEDIUM_STRING,
                HEADER_SIZE_LIMITS.LARGE_STRING,
            );

            return [...headers, ...take(bytes, size)];
        }

        case 'object': {
            return data
                ? packObject(protocol, data)
                : [NULL_BYTES];
        }

        default: {
            return [NULL_BYTES];
        }
    }
}

function packHeader(size: number, tiny: number, medium: number, large: number): { size: number, headers: number[] } {
    size = Math.min(size, MAX_HEADER_SIZE);

    if (size < 0x10) {
        return {size, headers: [tiny + size]};
    }

    if (size < 0x10000) {
        return {size, headers: [medium, size >> 8, size & 255]};
    }

    return {size, headers: [large, size >> 24, size >> 16 & 255, size >> 8 & 255, size & 255]};
}

function packInt(num: number): number[] {
    if (num >= -0x10 && num < 0x80) {
        return [(0x100 + num) % 0x100];
    }

    if (num >= -0x8000 && num < 0x8000) {
        return [0xC9, num >> 8, num & 255];
    }

    if (num >= -0x80000000 && num < 0x80000000) {
        return [0xCA, num >> 24, num >> 16 & 255, num >> 8 & 255, num & 255];
    }

    return packFloat(num);
}

function packFloat(num: number): number[] {
    const array = new Uint8Array(8);
    const view = new DataView(array.buffer);

    view.setFloat64(0, num, false);

    return [
        0xC1,
        ...array
    ];
}

function packString(str: string): number[] {
    return flatMap([...str], (_, index) => {
        const charCode = str.charCodeAt(index);
        const codePoint = charCode >= 0xD800 && charCode < 0xDC00 && index + 1 < str.length
            ? 0x10000 + ((charCode - 0xD800) << 10) + (str.charCodeAt(index + 1) - 0xDC00)
            : charCode;

        if (codePoint < 0x0080) {
            return [codePoint];
        }

        if (codePoint < 0x0800) {
            return [(codePoint >> 6) | 0xC0, (codePoint & 0x3F) | 0x80];
        }

        if (codePoint < 0x10000) {
            return [
                (codePoint >> 12) | 0xE0,
                ((codePoint >> 6) & 0x3F) | 0x80,
                (codePoint & 0x3F | 0x80)
            ];
        }

        if (codePoint < 0x110000) {
            return [
                (codePoint >> 18) | 0xF0,
                ((codePoint >> 12) & 0x3F) | 0x80,
                ((codePoint >> 6) & 0x3F) | 0x80,
                (codePoint & 0x3F | 0x80)
            ];
        }

        return [0xFF, 0xFD];
    });
}

function packObject(protocol: BOLT_PROTOCOLS, val: any): number[] {
    const tmp = entries(val);
    const {size, headers} = packHeader(
        tmp.length,
        HEADER_SIZE_LIMITS.TINY_OBJECT,
        HEADER_SIZE_LIMITS.MEDIUM_OBJECT,
        HEADER_SIZE_LIMITS.LARGE_OBJECT,
    );

    return [
        ...headers,
        ...flatMap(take(tmp, size), ([key, value]) => [
            ...packRequestData(protocol, key),
            ...packRequestData(protocol, value),
        ])
    ];
}
