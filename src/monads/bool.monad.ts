import Monad from './monad';

export default class Bool extends Monad<boolean> {
    static of(val: any) {
        return new Bool(Boolean(val))
    }

    constructor(value = false) {
        super(value);
    }

    isEmpty() {
        return false;
    }
}
