import RequestMessage from '../../request-message/request-message.class';

export default abstract class BoltProtocolAbstract {
    abstract fromBuffer(data: Buffer): RequestMessage;
    abstract toBuffer(data: RequestMessage): Buffer;
}
