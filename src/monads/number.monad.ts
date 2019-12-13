import Monad from './monad';

export default class NumberMonad extends Monad<Number> {
    constructor(value = 0) {
        super(value);
    }

    isEmpty() {
        return false;
    }
}
