import {IMonad} from './monad';

// @ts-ignore
export interface IList<T> extends IMonad<T> {
    equals(other: IMonad<any>): boolean;
    get(): T[];
    // @todo: fix typings of return
    getOrElse<R extends any>(other: R): T[] | R;
    isEmpty(): boolean;
    toString(formatter?: (val: T[]) => string): string
    map<R>(project: (value: T[]) => R[]): IList<R>;
    flatMap<R, M extends IMonad<R>>(project: (value: T[]) => M): M;
}

export default class List<T> implements IList<T> {
    constructor(protected value: T[]) {}

    *[Symbol.iterator](): Iterator<T> {
        for (const val of this.value) {
            yield val;
        }
    }

    isEmpty() {
        return this.value.length === 0;
    }

    get() {
        return this.value
    }

    getOrElse<R>(other: R) {
        return this.isEmpty()
            ? other
            : this.value;
    }

    equals(other: IMonad<any>) {
        if (other.constructor !== this.constructor) return false;

        return other.map((val) => val === this.value).get();
    }

    // @todo: fix typings of return
    map<R>(project: (value: T[]) => R[]) {
        return new List<R>(project(this.value));
    }

    flatMap<R, M extends IMonad<R>>(project: (value: T[]) => M) {
        return project(this.value);
    }

    toString(formatter?: (val: T[]) => string) {
        const value = formatter
            ? formatter(this.value)
            : this.value;

        return `${value}`;
    }
}
