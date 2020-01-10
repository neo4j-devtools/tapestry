import {Bool, Num, Str} from './monads/index';

const bool = new Bool;
const num = new Num(5);
const str = new Str;
const foo = Bool.from(true);

const newNum = num.getOrElse(0);

const bar  = 5:
bar.toPrecision()
num.add(5)

console.log(newNum.equals(num));
