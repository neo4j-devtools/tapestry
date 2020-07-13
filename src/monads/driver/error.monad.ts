import {entries} from 'lodash';
import {Monad, Dict} from '@relate/types';

export type RawErrorMonad<T = Monad<any>> = Map<'code' | 'message', T>

export default class ErrorMonad<T = Monad<any>> extends Dict<T> {
    constructor(val: RawErrorMonad<T>) {
        super(val);
    }

    static isErrorMonad<T = Monad<any>>(val: any): val is ErrorMonad<T> {
        return val instanceof ErrorMonad;
    }

    static of<T = Monad<any>>(val: any): ErrorMonad<T> {
        const sane: ['code' | 'message', T][] = Array.isArray(val)
            ? val
            : entries(val);

        return new ErrorMonad<T>(new Map(sane));
    }

    static from<T = Monad<any>>(val: any): ErrorMonad<T> {
        return ErrorMonad.isErrorMonad<T>(val)
            ? val
            : ErrorMonad.of<T>(val);
    }

    static fromObject<T = Monad<any>>(obj: object) {
        return ErrorMonad.of<T>(obj);
    }
}
