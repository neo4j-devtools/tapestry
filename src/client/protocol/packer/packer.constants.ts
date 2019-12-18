export const TINY_STRING = 0x80;
export const TINY_LIST = 0x90;
export const TINY_MAP = 0xa0;
export const TINY_STRUCT = 0xb0;
export const NULL = 0xc0;
export const FLOAT_64 = 0xc1;
export const FALSE = 0xc2;
export const TRUE = 0xc3;
export const INT_8 = 0xc8;
export const INT_16 = 0xc9;
export const INT_32 = 0xca;
export const INT_64 = 0xcb;
export const STRING_8 = 0xd0;
export const STRING_16 = 0xd1;
export const STRING_32 = 0xd2;
export const LIST_8 = 0xd4;
export const LIST_16 = 0xd5;
export const LIST_32 = 0xd6;
export const BYTES_8 = 0xcc;
export const BYTES_16 = 0xcd;
export const BYTES_32 = 0xce;
export const MAP_8 = 0xd8;
export const MAP_16 = 0xd9;
export const MAP_32 = 0xda;
export const STRUCT_8 = 0xdc;
export const STRUCT_16 = 0xdd;

export const NODE = 0x4e;
export const NODE_STRUCT_SIZE = 3;

export const RELATIONSHIP = 0x52;
export const RELATIONSHIP_STRUCT_SIZE = 5;

export const UNBOUND_RELATIONSHIP = 0x72;
export const UNBOUND_RELATIONSHIP_STRUCT_SIZE = 3;

export const PATH = 0x50;
export const PATH_STRUCT_SIZE = 3;

export const POINT_2D = 0x58;
export const POINT_2D_STRUCT_SIZE = 3;

export const POINT_3D = 0x59;
export const POINT_3D_STRUCT_SIZE = 4;

export const DURATION = 0x45;
export const DURATION_STRUCT_SIZE = 4;

export const LOCAL_TIME = 0x74;
export const LOCAL_TIME_STRUCT_SIZE = 1;

export const TIME = 0x54;
export const TIME_STRUCT_SIZE = 2;

export const DATE = 0x44;
export const DATE_STRUCT_SIZE = 1;

export const LOCAL_DATE_TIME = 0x64;
export const LOCAL_DATE_TIME_STRUCT_SIZE = 2;

export const DATE_TIME_WITH_ZONE_OFFSET = 0x46;
export const DATE_TIME_WITH_ZONE_OFFSET_STRUCT_SIZE = 3;

export const DATE_TIME_WITH_ZONE_ID = 0x66;
export const DATE_TIME_WITH_ZONE_ID_STRUCT_SIZE = 3;
