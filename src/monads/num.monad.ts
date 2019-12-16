import Monad from './monad';

export default class Num extends Monad<number> {
    static of(val: any) {
        return new Num(Number(val))
    }

    constructor(value = 0) {
        super(value);
    }

    isEmpty() {
        return typeof this.original === 'number' && !isNaN(this.original);
    }
}
