import Monad from './monad';

export default class Bool extends Monad<boolean> {
    static of(val: any) {
        return new Bool(Boolean(val))
    }

    static from(val: any) {
        return val instanceof Bool
            ? val
            : new Bool(val)
    }

    constructor(value = false) {
        super(value);
    }

    isEmpty() {
        return false;
    }
}
