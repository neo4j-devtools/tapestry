import {List, Monad} from '../monads';
import {Packer} from './packstream/packer/packer';
import {Unpacker} from './packstream/unpacker/unpacker';
import {DRIVER_HEADERS} from './driver.constants';

export interface IAuth {
    scheme: 'basic',
    principal: string,
    credentials: string;
}

export interface IConnectionParams<Data extends any = List<Monad<any>>> {
    secure?: true;
    auth: IAuth;
    host: string;
    port: number;
    userAgent: string;
    getHeader?: (unpacked: Data) => DRIVER_HEADERS,
    getData?: (unpacked: Data) => Data,
    packer?: Packer<Data>;
    unpacker?: Unpacker<Data>;
}
