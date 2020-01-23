import {entries, map, join} from 'lodash';

import Monad from '../monad';
import {arrayHasItems} from '../../utils/array.utils';
import Maybe from './maybe.monad';
import Str from './str.monad';

export type RawDict<T = Monad<any>> = Map<string, T>

export default class Dict<T = Monad<any>> extends Monad<RawDict<T>> {
    private readonly keys: readonly Str[];

    constructor(val: RawDict<T>) {
        super(val);

        // @todo: could be optimised
        this.keys = Object.freeze(map([...val.keys()], Str.of));
    }

    static isDict(val: any): val is Dict {
        return val instanceof Dict;
    }

    static of(val: any) {
        const sane: [string, Monad<any>][] = Array.isArray(val)
            ? val
            : entries(val);

        return new Dict(new Map(sane));
    }

    static from(val: any) {
        return val instanceof Dict
            ? val
            : Dict.of(val);
    }

    static fromObject(obj: object) {
        return Dict.of(obj);
    }

    isEmpty(): boolean {
        return arrayHasItems(this.keys);
    }

    hasKey(index: number): boolean {
        return index >= 0 && index < this.keys.length;
    }

    getKey(index: number): Maybe<Str> {
        return Maybe.of<Str>(this.keys[index]);
    }

    hasValue(key: string): boolean {
        return this.original.has(key);
    }

    getValue(key: string): Maybe<T> {
        return Maybe.of(this.original.get(key));
    }

    toString(): string {
        return `{${join(map([...this.original.entries()], ([key, val]) => `${key}: ${val}`), ', ')}}`;
    }
}
