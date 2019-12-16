import Monad from '../monad';
import None from './none.monad';

export default class Maybe<T = Monad<any>> extends Monad<T | None<T>> {
    constructor(val?: T | None) {
        // @ts-ignore
        super(val);
    }

    static isMaybe<T = Monad<any>>(val: any): val is Maybe<T> {
        return val instanceof Maybe;
    }

    static of<T = Monad<any>>(val?: T | None): Maybe<T> {
        const sane = val !== undefined
            ? val
            : None.EMPTY;

        return new Maybe<T>(sane);
    }

    static from<T = Monad<any>>(val: any): Maybe<T> {
        return Maybe.isMaybe(val)
            ? val
            : Maybe.of(val);
    }

    getOrElse(other: T): T {
        // @ts-ignore
        return super.getOrElse(other);
    }

    isEmpty() {
        return None.isNone(this.original);
    }
}
