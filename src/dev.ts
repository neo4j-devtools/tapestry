import {filter, reduce} from 'rxjs/operators';
import _ from 'lodash'

import {Driver, DRIVER_RESULT_TYPE, List, Result} from './index';
import {forkJoin} from 'rxjs';

const driver = new Driver<Result>({
    useRouting: true,
    maxPoolSize: 10,
    connectionConfig: {
        port: 7697
    }
});

const query = driver.query('RETURN 1', {}).pipe(
    filter(({type}) => type === DRIVER_RESULT_TYPE.RECORD),
    reduce((agg, next) => agg.concat(next), List.of<Result>([]))
);
const result = forkJoin(_.map(Array(10), () => query));

result.subscribe({
    next: console.log,
    error: console.error,
    complete: driver.shutDown
})


