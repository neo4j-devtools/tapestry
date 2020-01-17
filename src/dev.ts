import {Driver} from './client';
import {Monad} from './monads';

const driver = new Driver<Monad<any>>({});

driver.runQuery('RETURN 1').subscribe(console.log);
