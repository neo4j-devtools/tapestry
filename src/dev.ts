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

driver.query('MATCH (n) RETURN n LIMIT 1', {}, {db: 'system'})
    .pipe(
        reduce((agg, next) => agg.concat(next), [])
    ).subscribe({
    next: console.log,
    complete: () => driver.shutDown().toPromise(),
    error: (err) => {
        console.error(err);

        driver.shutDown().toPromise();
    }
})
