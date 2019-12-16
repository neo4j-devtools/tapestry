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
