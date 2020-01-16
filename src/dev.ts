import {Connection} from './client';
import {getRetrieveMessage, getTestMessage} from './client/driver.utils';
import {Monad} from './monads';

const con = new Connection<Monad<any>>({});
const [testCmd, testData] = getTestMessage();
const [retrieveCmd, retrieveData] = getRetrieveMessage();

con.sendMessage(testCmd, testData);
con.sendMessage(retrieveCmd, retrieveData);
con.subscribe((val) => {
    console.log(val);
    con.terminate();
});
