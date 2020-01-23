import Monad from '../monad';
import {DRIVER_RESULT_TYPE} from '../../driver';
import {Dict, List} from '../index';

export type RawResult<Data = List<Monad<any>>, Header = Dict<Monad<any>>> = {
    header: Header,
    type: DRIVER_RESULT_TYPE,
    data: Data,
};

export default class Result<Data = List<Monad<any>>, Header = Dict<Monad<any>>> extends Monad<RawResult<Data, Header>> {
    get header() {
        return this.original.header;
    }

    get data() {
        return this.original.data;
    }

    get type() {
        return this.original.type;
    }

    static isResult<Data = Monad<any>, Header = Data>(val: any): val is Result<Data, Header> {
        return val instanceof Result;
    }

    static of<Data = Monad<any>, Header = Data>(val: any): Result<Data, Header> {
        // @todo: typechecking
        return new Result<Data, Header>(val);
    }

    static from<Data = Monad<any>, Header = Data>(val: any): Result<Data, Header> {
        return Result.isResult<Data, Header>(val)
            ? val
            : Result.of<Data, Header>(val);
    }

    * [Symbol.iterator](): Iterator<this> {
        return this;
    }

    toString(): string {
        return `${this.constructor.name} {${this.header}, ${this.data}}`;
    }
}
