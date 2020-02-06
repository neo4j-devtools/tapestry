# Tapestry
A neo4j driver spike illustrating an RxJS based monadic driver with full typescript support and a pluggable packstream.

Help keep the dream alive!

## ToC
1. [Basic usage](#basic-usage)
    - [Initialisation](#initialisation)
    - [Queries](#queries)
    - [Transactions](#transactions)
    - [Routing](#routing)
2. [Custom unpackers](#custom-unpackers)
3. [Configuration](#configuration)


## Basic Usage
### Initialisation
```Typescript
import {Driver} from '.';

const driver = new Driver({
    connectionConfig: {
        auth: {
            scheme: 'basic',
            principal: 'neo4j',
            credentials: 'neo4j'
        }
    }
});
```

### Queries
```Typescript
import {Driver} from '.';

const driver = new Driver({});

// Reactive
driver.query('RETURN $foo', {foo: true}).subscribe({
    next: console.log,
    complete: driver.shutDown,
    error: driver.shutDown
})

// Promise
driver.query('RETURN $foo', {foo: true})
    .toPromise()
    .then(console.log)
    .catch(console.error)
    .finally(driver.shutDown);
```

### Transactions
```Typescript
import {flatMap, tap} from 'rxjs';

import {Driver, Num} from '.';

const driver = new Driver({});

// Reactive
driver.transaction().pipe(
    flatMap((tx) => tx.query('CREATE (n {foo: $foo}) RETURN n', {foo: true}).pipe(
        tap(({data}) => data.length.greaterThan(Num.ZERO)
            ? tx.commit()
            : tx.rollback()
        )
    ))
).subscribe({
    next: console.log,
    complete: driver.shutDown,
    error: driver.shutDown
});

// Promise
getResults()
    .then(console.log)
    .catch(console.error)
    .finally(driver.shutDown)

async function getResults()  {
    const tx = await driver.transaction().toPromise();
    const q1 = await tx.query('CREATE (n {foo: $foo}) RETURN n', {foo: true}).toPromise();

    if (q1.data.length.equals(Num.ZERO)) {
        await tx.rollback().toPromise();

        return;
    }

    await tx.commit().toPromise();

    return q1;
}
```

## Routing
```TypeScript
import {forkJoin} from 'rxjs';
import {filter, reduce} from 'rxjs/operators';
import _ from 'lodash'

import {Driver, DRIVER_RESULT_TYPE, List, Result} from './index';

const driver = new Driver<Result>({
    useRouting: true,
    maxPoolSize: 10
});

const query = driver.query('RETURN 1', {}).pipe(
    filter(({type}) => type === DRIVER_RESULT_TYPE.RECORD),
    reduce((agg, next) => agg.concat(next), List.of<Result>([]))
);

// Reactive
const result = forkJoin(_.map(Array(10), () => query));

result.subscribe({
    next: console.log,
    error: console.error,
    complete: driver.shutDown
})

// Promise
const result = Promise.all(_.map(Array(10), () => query.toPromise()));

result
    .then(console.log)
    .catch(console.error)
    .finally(driver.shutDown);
```

## Custom unpackers
Example using a [custom JSON unpacker](./src/packstream/unpacker/json-unpacker.ts), removing all monads from results.
```Typescript
import {reduce} from 'rxjs/operators';

import {Driver, DRIVER_HEADERS, JsonUnpacker} from '.';

const driver = new Driver<any>({
    connectionConfig: {
        unpacker: JsonUnpacker,
        getResponseHeader: (data): DRIVER_HEADERS => data[0] || DRIVER_HEADERS.FAILURE,
        getResponseData: (data): any => data[1] || []
    },
    mapToResult: (headerRecord, type, data) => ({header: headerRecord, type, data})
});

driver.query('MATCH (n) RETURN n')
    .pipe(
        reduce((agg, next) => agg.concat(next), [])
    ).subscribe({
        next: console.log,
        complete: driver.shutDown,
        error: driver.shutDown
    })
```

## Configuration
```Typescript
import {
    Packer,
    Unpacker,
    DRIVER_HEADERS,
    DRIVER_RESULT_TYPE
} from '.';

export interface IAuthToken {
    scheme: 'basic',
    principal: string,
    credentials: string;
}

export interface IConnectionConfig<Data = any> {
    secure?: true;
    authToken: IAuthToken;
    host: string;
    port: number;
    userAgent: string;
    getResponseHeader?: (unpacked: Data) => DRIVER_HEADERS,
    getResponseData?: (unpacked: Data) => Data,
    packer?: Packer<Data>;
    unpacker?: Unpacker<Data>;
}

export interface IDriverConfig<Rec = any> {
    maxPoolSize: number;
    discoveryIntervalMs: number;
    useRouting?: boolean;
    connectionConfig: Partial<IConnectionConfig>; // @todo: Partial is not correct
    mapToResultHeader: (headerRecord: any) => any;
    mapToResult: (headerRecord: any, type: DRIVER_RESULT_TYPE, data: any) => Rec;
}
```
