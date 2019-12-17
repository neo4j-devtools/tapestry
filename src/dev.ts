import {Bool, Num, Str} from './monads/index';
import CombinedBuffer from './client/buffers/combined.buffer';

const bool = new Bool;
const num = new Num;
const str = new Str;

const foo = Bool.from(true);

const bar = new CombinedBuffer([]);

const bax = [...bar];

console.log(bool, num, str, foo);
