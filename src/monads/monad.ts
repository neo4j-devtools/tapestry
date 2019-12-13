export interface IMonad<T> extends Iterable<T> {
    equals(other: IMonad<any>): boolean;
    get(): T;
    // @todo: fix typings of return
    getOrElse<R extends any>(other: R): T | R;
    isEmpty(): boolean;
    toString(formatter?: (val: T) => string): string
    map<R>(project: (value: T) => R): IMonad<R>;
    flatMap<R, M extends IMonad<R>>(project: (value: T) => M): M;
}

export default class Monad<T> implements IMonad<T> {
    constructor(protected value: T) {}

    *[Symbol.iterator](): Iterator<T> {
        yield this.value;
    }

    isEmpty() {
        return true;
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
    map<R>(project: (value: T) => R) {
        return new Monad<R>(project(this.value));
    }

    flatMap<R, M extends IMonad<R>>(project: (value: T) => M) {
        return project(this.value);
    }

    toString(formatter?: (val: T) => string) {
        const value = formatter
            ? formatter(this.value)
            : this.value;

        return `${value}`;
    }
}
