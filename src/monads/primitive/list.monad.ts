import Monad from '../monad';
import Maybe from './maybe.monad';

export default class List<T extends Monad<any> = Monad<any>> extends Monad<T[]> {
    // @ts-ignore
    protected iterableValue: Iterable<T>;
    protected ourFirst?: Maybe<T>;
    protected ourLast?: Maybe<T>;

    static isList(val: any): val is List {
        return val instanceof List;
    }

    static of(val: any) {
        const sane: Monad<any>[] = Array.isArray(val)
            ? val
            : Array.of(val);

        return new List(sane);
    }

    static from(val: any) {
        return val instanceof List
            ? val
            : List.of(val);
    }

    constructor(val: T[]) {
        // @ts-ignore
        super(val);
    }

    // @ts-ignore
    * [Symbol.iterator](): Iterator<T> {
        for (const val of this.iterableValue) {
            yield val;
        }
    }

    isEmpty(): boolean {
        return false; // @todo
    }

    hasIndex(index: number): boolean {
        return index >= 0 && index < this.original.length;
    }

    getIndex(index: number): T | undefined {
        return this.original[index];
    }

    first(): Maybe<T> {
        if (this.ourFirst) {
            return this.ourFirst;
        }

        const it = this[Symbol.iterator]();

        // @ts-ignore
        this.ourFirst = Maybe.of(it.next().value);

        return this.ourFirst!;
    }

    last(): Maybe<T> {
        if (this.ourLast) {
            return this.ourLast;
        }

        const arr = [...this].reverse();

        // @ts-ignore
        this.ourLast = Maybe.of(arr[0]);

        return this.ourLast!;
    }

    slice<O extends Monad<any> = T>(from: number, to?: number): List<O> {
        const it = this[Symbol.iterator]();
        const res = [];
        let current = it.next();
        let i = 0;

        while (!current.done && to && i < to) {
            if (i >= from) {
                res.push(current.value);
            }

            i++;
            current = it.next();
        }

        // @ts-ignore
        return List.of([...res]);
    }

    toString() {
        return JSON.stringify(this.getOrElse([]));
    }
}
