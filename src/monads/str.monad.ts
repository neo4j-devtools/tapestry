import Monad from './monad';

export default class Str extends Monad<string> {
    static of(val: any) {
        return new Str(String(val))
    }

    constructor(value = '') {
        super(value);
    }

    isEmpty() {
        return this.original !== '';
    }
}
