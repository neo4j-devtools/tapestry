import Monad from '../monad';

export default class None<T extends any = any> extends Monad<T> {
    static EMPTY = new None();

    static isNone(val: any): val is None {
        return val instanceof None;
    }

    static of(_?: any) {
        return None.EMPTY;
    }

    static from(_?: any) {
        return None.EMPTY
    }

    constructor() {
        // @ts-ignore
        super(null);
    }

    isEmpty() {
        return true
    }
}
