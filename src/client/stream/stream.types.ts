export type StreamConfig = {}

export type StreamMessage = {
    connectionId: string;
    queryId: string;
    // @todo: status, results, meta?
}
