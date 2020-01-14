import Monad from '../monad';

export default class None<T extends any = any> extends Monad<T> {
    static EMPTY = new None();

    static isNone<T extends any = any>(val: any): val is None<T> {
        return val instanceof None;
    }

    static of<T extends any = any>(_?: any): None<T> {
        return None.EMPTY;
    }

    static from<T extends any = any>(_?: any): None<T> {
        return None.EMPTY
    }

    constructor() {
        // @ts-ignore
        super(null);
    }

    isEmpty(): true {
        return true
    }
}
