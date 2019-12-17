import Monad from './monad';

export default class Str extends Monad<string> {
    static of(val: any) {
        return new Str(String(val))
    }

    static from(val: any) {
        return val instanceof Str
            ? val
            : new Str(val)
    }

    constructor(value = '') {
        super(value);
    }

    isEmpty() {
        return this.original !== '';
    }
}
