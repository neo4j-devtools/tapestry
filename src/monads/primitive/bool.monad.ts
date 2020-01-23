import Monad from '../monad';

export default class Bool extends Monad<boolean> {
    constructor(value = false) {
        super(value);
    }

    get isEmpty() {
        return false;
    }

    static isBool(val: any): val is Bool {
        return val instanceof Bool;
    }

    static of(val: any): Bool {
        return new Bool(Boolean(val));
    }

    static from(val: any): Bool {
        return val instanceof Bool
            ? val
            : Bool.of(val);
    }
}
