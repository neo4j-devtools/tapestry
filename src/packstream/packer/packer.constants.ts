export enum BOLT_REQUEST_DATA_TYPE {
    ARRAY = 'array',
    BOOLEAN = 'boolean',
    NUMBER = 'number',
    STRING = 'string',
    OBJECT = 'object',
    UNKNOWN = 'unknown',
}

export enum HEADER_SIZE_LIMITS {
    TINY_ARRAY = 0x90,
    MEDIUM_ARRAY = 0xD5,
    LARGE_ARRAY = 0xD6,
    TINY_STRING = 0x80,
    MEDIUM_STRING = 0xD1,
    LARGE_STRING = 0xD2,
    TINY_OBJECT = 0xA0,
    MEDIUM_OBJECT = 0xD9,
    LARGE_OBJECT = 0xDA,
    TINY_STRUCT = 0xb0,
    STRUCT_8 = 0xdc,
    STRUCT_16 = 0xdd,
}

export const MAX_HEADER_SIZE = 0x7FFFFFFF;
export const BOOLEAN_TRUE_BYTES = 0xC3;
export const BOOLEAN_FALSE_BYTES = 0xC2;
export const NULL_BYTES = 0xC0;
