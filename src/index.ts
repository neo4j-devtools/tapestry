import {has} from 'lodash';

// @todo: cleanup
if (!has(global, 'WebSocket')) {
    //@ts-ignore
    global['WebSocket'] = require('ws');
}

export * from './driver';
export * from './connection';
export * from './types';
export * from './monads';
export * from './packstream';
