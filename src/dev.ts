import {reduce} from 'rxjs/operators';

import {Driver, DRIVER_HEADERS} from './index';
import {JSONUnpackerV1} from './json-unpacker.v1';

const driver = new Driver<any>({
    connectionConfig: {
        unpacker: JSONUnpackerV1,
        getResponseHeader: (data: any[]): DRIVER_HEADERS => data[0] || DRIVER_HEADERS.FAILURE,
        getResponseData: (data: any[]): any => data[1] || [],
    },
    mapToRecord: (headerRecord: any, data: any) =>({header: headerRecord, data})
});

console.time('runQuery');
const result = driver.runQuery('MATCH (n) RETURN n LIMIT 100')
    .pipe(
        reduce((agg, next) => agg.concat(next), [])
    ).toPromise();

result.then((res) => {
    console.log('runQuery', res);
    console.timeEnd('runQuery');
});
