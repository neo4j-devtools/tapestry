import Monad from './monad';

export default class BooleanMonad extends Monad<boolean> {
    constructor(value = false) {
        super(value);
    }

    isEmpty() {
        return false;
    }
}
