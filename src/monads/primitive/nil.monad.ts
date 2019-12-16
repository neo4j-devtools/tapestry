import Monad from '../monad';

export default class Nil extends Monad<null> {
    constructor(_?: any) {
        super(null);
    }

    static isNil(val: any): val is Nil {
        return val instanceof Nil;
    }

    static of(val?: any) {
        return new Nil(val);
    }

    static from(val: any) {
        return val instanceof Nil
            ? val
            : Nil.of(val);
    }

    isEmpty() {
        return false;
    }
}
