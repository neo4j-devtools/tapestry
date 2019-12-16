import Monad from '../monad';

export type RawRecord<Data = Monad<any>, Header = Data> = {
    header: Header,
    data: Data,
};

export default class RecordMonad<Data = Monad<any>, Header = Data> extends Monad<RawRecord<Data, Header>> {
    static isRecordMonad<Data = Monad<any>, Header = Data>(val: any): val is RecordMonad<Data, Header> {
        return val instanceof RecordMonad;
    }

    static of<Data = Monad<any>, Header = Data>(val: any) {
        // @todo: typechecking
        return new RecordMonad<Data, Header>(val);
    }

    static from<Data = Monad<any>, Header = Data>(val: any): RecordMonad<Data, Header> {
        return val instanceof RecordMonad
            ? val
            : RecordMonad.of<Data, Header>(val);
    }

    getHeader() {
        return this.original.header;
    }

    getData() {
        return this.original.data;
    }

    toString(): string {
        return `${this.constructor.name} {${this.getHeader()}, ${this.getData()}}`;
    }
}
