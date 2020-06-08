import {Driver, DRIVER_RESULT_TYPE} from '.';
import {List, Result} from './monads';
import {filter, reduce} from 'rxjs/operators';

const driver = new Driver<Result>({
    connectionConfig: {
        authToken: {
            scheme: 'basic',
            principal: 'neo4j',
            credentials: 'dsadsa',
        },
    },
});

// Promise
getResults()
    .then(console.log)
    .catch(console.error)
    .finally(() => driver.shutDown().toPromise());

async function getResults() {
    const q1 = await driver.query('RETURN "foo" as bar').pipe(
        filter(({type}) => type === DRIVER_RESULT_TYPE.RECORD),
        reduce((agg, next) => agg.concat(next), List.of<Result>([])),
    ).toPromise();

    return `${q1}`;
}
