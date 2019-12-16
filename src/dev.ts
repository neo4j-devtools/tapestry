import {Bool, Num, Str} from './monads/index';

const bool = new Bool;
const num = new Num;
const str = new Str;

const foo = new Bool()
    .map((v) => !v)
    .flatMap(Str.of);

console.log(bool, num, str, foo);
