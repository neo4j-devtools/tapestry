import Monad from '../monad';

export default class Str extends Monad<string> {
    constructor(value = '') {
        super(value);
    }

    static isStr(val: any): val is Str {
        return val instanceof Str;
    }

    static of(val: any) {
        return new Str(val !== undefined ? String(val) : '');
    }

    static from(val: any) {
        return val instanceof Str
            ? val
            : Str.of(val);
    }

    isEmpty() {
        return typeof this.original !== 'string' || this.original.length === 0;
    }
}
