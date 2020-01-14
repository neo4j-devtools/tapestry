import {entries} from 'lodash';

import Monad from '../monad';
import {arrayHasItems} from '../../utils/array.utils';

export type RawDict<T = Monad<any>> = Map<string, T>

export default class Dict<T = Monad<any>> extends Monad<RawDict<T>> {
    private readonly keys: readonly string[];

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

    constructor(val: RawDict<T>) {
        super(val);

        // @todo: could be optimised
        this.keys = Object.freeze([...val.keys()]);
    }

    isEmpty(): boolean {
        return arrayHasItems(this.keys);
    }

    hasKey(index: number): boolean {
        return index >= 0 && index < this.keys.length;
    }

    getKey(index: number): string | undefined {
        return this.keys[index];
    }

    hasValue(key: string): boolean {
        return this.original.has(key);
    }

    getValue(key: string): T | undefined {
        return this.original.get(key);
    }

    static fromObject(obj: object) {
        return Dict.of(obj);
    }

    toString() {
        return JSON.stringify(this.getOrElse(new Map));
    }
}
