import {Subject} from 'rxjs';
import BoltProtocolAbstract from './bolt-protocols/bolt-protocol.abstract';
import {createNegotiatedProtocol} from '../../utils/protocol.utils';
import NodeBuffer from '../buffers/node.buffer';

export default class Protocol extends Subject<BoltProtocolAbstract> {
    determineProtocolFromMessage(message: Buffer) {
        this.next(createNegotiatedProtocol(new NodeBuffer(message)));
    }
}

