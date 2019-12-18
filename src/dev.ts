import {Bool, Num, Str} from './monads/index';

const bool = new Bool;
const num = new Num;
const str = new Str;
const foo = Bool.from(true);

console.log(bool, num, str, foo);
