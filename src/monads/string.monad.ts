import Monad from './monad';

export default class StringMonad extends Monad<string> {
    constructor(value = '') {
        super(value);
    }

    isEmpty() {
        return this.value !== '';
    }
}
