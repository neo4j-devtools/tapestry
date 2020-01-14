import Monad from '../monad';
import None from './none.monad';

export default class Maybe<T = Monad<any>> extends Monad<T> {
    static isMaybe(val: any): val is Maybe {
        return val instanceof Maybe;
    }

    static of<T = Monad<any>>(val?: T | None): Maybe<T> {
        const sane = val !== undefined
            ? val
            : None.EMPTY;

        return new Maybe<T>(sane);
    }

    static from(val: any) {
        return Maybe.isMaybe(val)
            ? val
            : Maybe.of(val);
    }

    constructor(val?: T | None) {
        // @ts-ignore
        super(val);
    }

    isEmpty() {
        return None.isNone(this.original);
    }
}
