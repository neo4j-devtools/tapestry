import {has} from 'lodash';

// @todo: cleanup
if (!has(global, 'WebSocket')) {
    //@ts-ignore
    global['WebSocket'] = require('ws');
}

export {default as Driver} from './driver/driver.class';
