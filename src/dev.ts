import {Driver} from './client';
import {Monad} from './monads';

const driver = new Driver<Monad<any>>({});

driver.runQuery('RETURN 1').subscribe((res) => console.log('1', res));
driver.runQuery('RETURN 2').subscribe((res) => console.log('2', res));
