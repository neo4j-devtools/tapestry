import {BooleanMonad, NumberMonad, StringMonad} from './monads/index';

const bool = new BooleanMonad;
const num = new NumberMonad;
const str = new StringMonad;

console.log(bool, num, str);
