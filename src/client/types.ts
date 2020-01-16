import {List, Monad} from '../monads/index';
import {Packer} from './packstream/packer/packer';
import {Unpacker} from './packstream/unpacker/unpacker';

export interface IAuth {
    scheme: 'basic',
    principal: string,
    credentials: string;
}

export interface IConnectionParams<T extends any = List<Monad<any>>> {
    secure?: true;
    auth: IAuth;
    host: string;
    port: number;
    userAgent: string;
    packer?: Packer<T>;
    unpacker?: Unpacker<T>;
}
