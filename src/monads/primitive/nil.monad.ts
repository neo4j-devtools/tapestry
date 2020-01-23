import Monad from '../monad';

export default class Nil extends Monad<null> {
    constructor(_?: any) {
        super(null);
    }

    get isEmpty() {
        return false;
    }

    static isNil(val: any): val is Nil {
        return val instanceof Nil;
    }

    static of(val?: any): Nil {
        return new Nil(val);
    }

    static from(val: any): Nil {
        return Nil.isNil(val)
            ? val
            : Nil.of(val);
    }
}
