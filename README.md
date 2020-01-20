# Tapestry
A neo4j driver spike illustrating an RXJS based monading driver with full typescript support and a pluggable packstream.

Help keep the dream alive!

```Typescript
import {Driver} from './client';
import {Dict, List, Monad, NodeMonad, RecordMonad, Str} from './monads';
import {filter, flatMap, map, reduce} from 'rxjs/operators';

type Header = Dict<Monad<any>>;
type Data = List<NodeMonad>;
type Rec = RecordMonad<Data, Header>;

const driver = new Driver<Data, Header, Rec>({});

console.time('runQuery');
driver.runQuery('RETURN 1').subscribe(); // preflight
const result = driver.runQuery('MATCH (n) RETURN n LIMIT 100')
    .pipe(
        flatMap((record) => record.getData()),
        map((node) => node.getIdentity()),
        filter((id) => id.greaterThan(0)),
        map(Str.of),
        reduce((agg, next) => agg.concat(next), List.of<Str>([]))
    ).toPromise();

result.then((res) => {
    console.log('runQuery', `${res}`);
    console.timeEnd('runQuery');
});

```

## Configuration
```Typescript
import {
    List,
    Monad,
    RecordMonad,
    Packer,
    Unpacker,
    DRIVER_HEADERS
} from '.';

export interface IAuth {
    scheme: 'basic',
    principal: string,
    credentials: string;
}

export interface IConnectionConfig<Data extends any = List<Monad<any>>> {
    secure?: true;
    auth: IAuth;
    host: string;
    port: number;
    userAgent: string;
    getResponseHeader?: (unpacked: Data) => DRIVER_HEADERS,
    getResponseData?: (unpacked: Data) => Data,
    packer?: Packer<Data>;
    unpacker?: Unpacker<Data>;
}

export interface IDriverConfig<Data = Monad<any>,
    Header = Data,
    Rec = RecordMonad<Data, Header>> {
    maxPoolSize: number;
    connectionConfig: IConnectionConfig<Data>;
    mapToRecordHeader: (headerRecord: Data) => Header;
    mapToRecord: (headerRecord: Header, data: Data) => Rec;
}
```
