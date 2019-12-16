export enum BOLT_PROTOCOLS {
    UNKNOWN = 0,
    V1 = 1,
    V2 = 2,
    V3 = 3,
    V4 = 4,
}

export enum V1_BOLT_MESSAGES {
    INIT = 0x01,
    ACK_FAILURE = 0x0E,
    RESET = 0x0F,
    RUN = 0x10,
    DISCARD_ALL = 0x2F,
    PULL_ALL = 0x3F,
}

export const V2_BOLT_MESSAGES = V1_BOLT_MESSAGES;

export enum V3_BOLT_MESSAGES {
    HELLO = 0x01,
    GOODBYE = 0x02,
    RUN = 0x10,
    BEGIN = 0x11,
    COMMIT = 0x12,
    ROLLBACK = 0x13,
    DISCARD_ALL = 0x2F,
    PULL_ALL = 0x3F,
}

export enum V4_BOLT_MESSAGES {
    HELLO = 0x01,
    GOODBYE = 0x02,
    RESET = 0x0F,
    RUN = 0x10,
    BEGIN = 0x11,
    COMMIT = 0x12,
    ROLLBACK = 0x13,
    DISCARD = 0x2F,
    PULL = 0x3F,
}
