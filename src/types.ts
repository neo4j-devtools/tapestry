import {
    DBMS_DB_STATUS,
    DBMS_MEMBER_ROLE,
    DRIVER_HEADERS,
    DRIVER_QUERY_COMMANDS,
    DRIVER_RESULT_TYPE,
    DRIVER_TRANSACTION_COMMANDS
} from './driver';
import {BOLT_PROTOCOLS} from './connection';
import {BOLT_REQUEST_DATA_TYPE, BOLT_RESPONSE_DATA_TYPES} from './packstream';
import {Bool, Str} from './monads';

export type Packer<T extends any = any> = (protocol: BOLT_PROTOCOLS, dataType: BOLT_REQUEST_DATA_TYPE, data: T) => number[];
export type PackerInternal<T extends any = any> = (protocol: BOLT_PROTOCOLS, dataType: BOLT_REQUEST_DATA_TYPE, data: T, packer: PackerInternal<T>) => number[];

export type Unpacker<T extends any = any> = (protocol: BOLT_PROTOCOLS, dataType: BOLT_RESPONSE_DATA_TYPES, view: DataView, size: number, pos: number) => UnpackerReturn<T>;
export type UnpackerInternal<T extends any = any> = (protocol: BOLT_PROTOCOLS, dataType: BOLT_RESPONSE_DATA_TYPES, view: DataView, size: number, pos: number, unpacker: UnpackerInternal<T>) => UnpackerReturn<T>;
export type UnpackerReturn<T> = { finalPos: number, data: T };

export interface IAuthToken {
    scheme: 'basic',
    principal: string,
    credentials: string;
}

export interface IConnectionConfig<Data = any> {
    secure?: true;
    authToken: IAuthToken;
    host: string;
    port: number;
    userAgent: string;
    getResponseHeader?: (unpacked: Data) => DRIVER_HEADERS,
    getResponseData?: (unpacked: Data) => Data,
    packer?: Packer<Data>;
    unpacker?: Unpacker<Data>;
}

export interface IDriverConfig<Rec = any> {
    maxPoolSize: number;
    discoveryIntervalMs: number;
    useRouting?: boolean;
    connectionConfig: Partial<IConnectionConfig>; // @todo: Partial is not correct
    mapToResultHeader: (headerRecord: any) => any;
    mapToResult: (headerRecord: any, type: DRIVER_RESULT_TYPE, data: any) => Rec;
}

export interface IServerMessage<Data = any> {
    header: DRIVER_HEADERS;
    data: Data;
}

export interface IClientMessage {
    cmd: DriverCommand;
    data: any[];
    additionalData?: (protocol: BOLT_PROTOCOLS) => any[]
}

export interface IRequest {
    id: string;
    role?: DBMS_MEMBER_ROLE,
    db?: string,
    messages: IClientMessage[];
}

export interface IBaseMeta {
    db?: string
}

export interface IRunQueryMeta extends IBaseMeta {
    pullN?: number
}

export interface ITransactionMeta {
    sessionId: string;
}

export type DriverCommand = DRIVER_QUERY_COMMANDS | DRIVER_TRANSACTION_COMMANDS;

export interface IDiscoveryTable {
    name: Str;
    address: Str;
    currentStatus: Str<DBMS_DB_STATUS>;
    role: Str<DBMS_MEMBER_ROLE>;
    isDefault: Bool
}

export type IDBMSMember = {
    dbName: string,
    role: DBMS_MEMBER_ROLE,
    host: string,
    port: number,
    currentStatus: DBMS_DB_STATUS,
    address: string
}
