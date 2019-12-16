import {List, Monad, RecordMonad} from '../monads';
import {Packer} from './packstream/packer/packer';
import {Unpacker} from './packstream/unpacker/unpacker';
import {DRIVER_HEADERS} from './driver/driver.constants';

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
    connectionConfig: IConnectionConfig<Data>;
    mapToRecordHeader: (headerRecord: Data) => Header;
    mapToRecord: (headerRecord: Header, data: Data) => Rec;
}
