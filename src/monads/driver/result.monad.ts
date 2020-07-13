import {Monad, Dict, List, Maybe, Str} from '@relate/types';

import {DRIVER_RESULT_TYPE} from '../../driver';
import CypherNum from '../cypher-num/cypher-num.monad';

export type RawResult<Data extends Monad<any> = Monad<any>, Header extends Monad<any> = Monad<any>> = {
    header: Dict<Header>,
    type: DRIVER_RESULT_TYPE,
    data: List<Data>,
};

// @ts-ignore
export default class Result<Data extends Monad<any> = Monad<any>, Header extends Monad<any> = Monad<any>> extends Monad<RawResult<Data, Header>> {
    get header(): Dict<Header> {
        return this.original.header;
    }

    get data(): List<Data> {
        return this.original.data;
    }

    get type(): DRIVER_RESULT_TYPE {
        return this.original.type;
    }

    get fields(): List<Str> {
        return this.header.getValue('fields').flatMap((val) =>
            List.isList<Str>(val)
                ? val
                : List.of<Str>([])
        );
    }

    getFieldData(field: Str | string): Maybe<Data> {
        const key = Str.from(field);

        return this.fields.indexOf(key).switchMap((val) => val.lessThan(CypherNum.ZERO.get())
            ? Maybe.of<Data>()
            : this.data.nth(val)
        );
    }

    static isResult<Data extends Monad<any> = Monad<any>, Header extends Monad<any> = Monad<any>>(val: any): val is Result<Data, Header> {
        return val instanceof Result;
    }

    static of<Data extends Monad<any> = Monad<any>, Header extends Monad<any> = Monad<any>>(val: any): Result<Data, Header> {
        // @todo: typechecking
        return new Result<Data, Header>(val);
    }

    static from<Data extends Monad<any> = Monad<any>, Header extends Monad<any> = Monad<any>>(val: any): Result<Data, Header> {
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
