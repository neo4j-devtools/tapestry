import {List, Monad, RecordMonad} from './monads';
import {DRIVER_HEADERS} from './driver/driver.constants';
import {BOLT_PROTOCOLS} from './connection/connection.constants';
import {BOLT_REQUEST_DATA_TYPE} from './packstream/packer/packer.constants';
import {BOLT_RESPONSE_DATA_TYPES} from './packstream/unpacker/unpacker.constants';

export type Packer<T extends any = any> = (protocol: BOLT_PROTOCOLS, dataType: BOLT_REQUEST_DATA_TYPE, data: T) => number[];
export type PackerInternal<T extends any = any> = (protocol: BOLT_PROTOCOLS, dataType: BOLT_REQUEST_DATA_TYPE, data: T, packer: PackerInternal<T>) => number[];

export type Unpacker<T extends any = any> = (protocol: BOLT_PROTOCOLS, dataType: BOLT_RESPONSE_DATA_TYPES, view: DataView, size: number, pos: number) => UnpackerReturn<T>;
export type UnpackerInternal<T extends any = any> = (protocol: BOLT_PROTOCOLS, dataType: BOLT_RESPONSE_DATA_TYPES, view: DataView, size: number, pos: number, unpacker: UnpackerInternal<T>) => UnpackerReturn<T>;
export type UnpackerReturn<T> = { finalPos: number, data: T };

export interface IAuth {
    scheme: 'basic',
    principal: string,
    credentials: string;
}

export interface IConnectionConfig<Data extends any = List<Monad<any>>> {
    secure?: true;
    auth: IAuth;
    host: string;
    port: number;
    userAgent: string;
    getResponseHeader?: (unpacked: Data) => DRIVER_HEADERS,
    getResponseData?: (unpacked: Data) => Data,
    packer?: Packer<Data>;
    unpacker?: Unpacker<Data>;
}

export interface IDriverConfig<Data = Monad<any>,
    Header = Data,
    Rec = RecordMonad<Data, Header>> {
    maxPoolSize: number;
    connectionConfig: Partial<IConnectionConfig<Data>>; // @todo: Partial is not correct
    mapToRecordHeader: (headerRecord: Data) => Header;
    mapToRecord: (headerRecord: Header, data: Data) => Rec;
}
