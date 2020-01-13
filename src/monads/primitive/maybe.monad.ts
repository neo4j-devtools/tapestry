import Monad from '../monad';
import None from './none.monad';

export default class Maybe<T = Monad<any>> extends Monad<T> {
    static isMaybe(val: any): val is Maybe {
        return val instanceof Maybe;
    }

    static of(val?: Monad<any>) {
        const sane = val !== undefined
            ? val
            : None.EMPTY;

        return new Maybe(sane);
    }

    static from(val: any) {
        return Maybe.isMaybe(val)
            ? val
            : Maybe.of(val);
    }

    isEmpty() {
        return None.isNone(this.original);
    }
}
