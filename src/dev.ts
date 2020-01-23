import {reduce} from 'rxjs/operators';

import {Driver, DRIVER_HEADERS} from './index';
import {JSONUnpackerV1} from './json-unpacker.v1';

const driver = new Driver<any>({
    connectionConfig: {
        unpacker: JSONUnpackerV1,
        getResponseHeader: (data): DRIVER_HEADERS => data[0] || DRIVER_HEADERS.FAILURE,
        getResponseData: (data): any => data[1] || []
    },
    mapToRecord: (headerRecord, data) => ({header: headerRecord, data})
});

console.time('runQuery');
const result = driver.runQuery('RETURN localtime() as foo')
    .pipe(
        reduce((agg, next) => agg.concat(next), [])
    ).toPromise();

result.then((res) => {
    console.log('runQuery', JSON.stringify(res, null, 2));
    console.timeEnd('runQuery');
});
