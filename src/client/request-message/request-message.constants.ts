// Signature bytes for each request message type
export const INIT = 0x01; // 0000 0001 // INIT <user_agent> <authentication_token>
export const ACK_FAILURE = 0x0e; // 0000 1110 // ACK_FAILURE - unused
export const RESET = 0x0f; // 0000 1111 // RESET
export const RUN = 0x10; // 0001 0000 // RUN <query> <parameters>
export const DISCARD_ALL = 0x2f; // 0010 1111 // DISCARD_ALL - unused
export const PULL_ALL = 0x3f; // 0011 1111 // PULL_ALL

export const HELLO = 0x01; // 0000 0001 // HELLO <metadata>
export const GOODBYE = 0x02; // 0000 0010 // GOODBYE
export const BEGIN = 0x11; // 0001 0001 // BEGIN <metadata>
export const COMMIT = 0x12; // 0001 0010 // COMMIT
export const ROLLBACK = 0x13; // 0001 0011 // ROLLBACK

export const DISCARD = 0x2f; // 0010 1111 // DISCARD
export const PULL = 0x3f; // 0011 1111 // PULL

export const READ_MODE = 'r';

export const NO_STATEMENT_ID = -1;
export const ALL = -1;
