import {flatMap, reduce, tap} from 'rxjs/operators';

import {Driver, List, Monad, Num, Result} from './index';

const driver = new Driver<Result>({});

console.time('transaction');
const secondResult = driver.transaction().pipe(
    flatMap((tx) => tx.query('CREATE (n {foo: $foo}) RETURN n', {foo: true}).pipe(
        reduce((acc, next) => acc.concat(next), List.of<Result<List<Monad<any>>>>([])),
        tap((foo) => {
            return foo.length.greaterThan(Num.ZERO)
                    ? tx.commit()
                    : tx.rollback()
            }
        ),
        //flatMap(() => tx.query('CREATE (n {foo: $foo}) RETURN n', {foo: true}))
    ))
).toPromise();

secondResult
    .then((res) => {
        console.log('transaction', JSON.stringify(res, null, 2));
        console.timeEnd('transaction');
        driver.shutDown();
    })
    .catch(console.error);
