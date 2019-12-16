export interface IMonad<T> extends Iterable<T> {
    equals(other: IMonad<any>): boolean;
    get(): T | undefined;
    getOrElse(other: T): T;
    isEmpty(): boolean;
    toString(formatter?: (val: T) => string): string
    map(project: (value: T) => T): IMonad<T>;
    flatMap<R, M extends IMonad<R>>(project: (value: T) => M): M;
}

export default class Monad<T extends any> implements IMonad<T> {
    static of(val: any) {
        return new Monad(val)
    }

    protected alreadyIterable = false;
    protected iterableValue: Iterable<T> = [];

    constructor(protected original: T) {
        // @ts-ignore
        this.alreadyIterable = original != null && typeof original[Symbol.iterator] === 'function';
        // @ts-ignore
        this.iterableValue = this.alreadyIterable
            ? original
            : [original];
    }

    *[Symbol.iterator](): Iterator<T> {
        for (const val of this.iterableValue) {
            yield val;
        }
    }

    isEmpty() {
        return true;
    }

    get() {
        return this.original
    }

    getOrElse(other: T) {
        return this.isEmpty()
            ? other
            : this.get();
    }

    first() {
        const it = this[Symbol.iterator]();

        return it.next().value;
    }

    last() {
        const arr = [...this].reverse();

        return arr[0];
    }

    equals(other: IMonad<any>) {
        if (other.constructor !== this.constructor) return false;

        return other.map((val) => val === this.original).get();
    }

    map(project: (value: T) => T): this {
        // @ts-ignore
        return new this.constructor(project(this.original));
    }

    flatMap<R, M extends IMonad<R>>(project: (value: T) => M): M {
        return project(this.original);
    }

    toString(formatter?: (val: T) => string) {
        const value = formatter
            ? formatter(this.original)
            : this.original;

        return `${value}`;
    }
}
