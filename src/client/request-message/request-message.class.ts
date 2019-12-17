import {
    ALL,
    BEGIN,
    COMMIT,
    DISCARD, GOODBYE,
    HELLO,
    INIT,
    NO_STATEMENT_ID,
    PULL,
    PULL_ALL,
    RESET,
    ROLLBACK,
    RUN
} from './request-message.constants';
import {buildStreamMetadata, buildTxMetadata} from './request-message.utils';

export default class RequestMessage {
    constructor(private signature: number, private fields: any[], public toString: () => string) {}

    /**
     * Create a new INIT message.
     * @param {string} clientName the client name.
     * @param {Object} authToken the authentication token.
     * @return {RequestMessage} new INIT message.
     */
    static init(clientName: string, authToken: any) {
        return new RequestMessage(
            INIT,
            [clientName, authToken],
            () => `INIT ${clientName} {...}`
        );
    }

    /**
     * Create a new RUN message.
     * @param {string} query the cypher query.
     * @param {Object} parameters the query parameters.
     * @return {RequestMessage} new RUN message.
     */
    static run(query: string, parameters: any) {
        return new RequestMessage(
            RUN,
            [query, parameters],
            () => `RUN ${query} ${JSON.stringify(parameters)}`
        );
    }

    /**
     * Get a PULL_ALL message.
     * @return {RequestMessage} the PULL_ALL message.
     */
    static pullAll() {
        return PULL_ALL_MESSAGE;
    }

    /**
     * Get a RESET message.
     * @return {RequestMessage} the RESET message.
     */
    static reset() {
        return RESET_MESSAGE;
    }

    /**
     * Create a new HELLO message.
     * @param {string} userAgent the user agent.
     * @param {Object} authToken the authentication token.
     * @return {RequestMessage} new HELLO message.
     */
    static hello(userAgent: string, authToken: any) {
        const metadata = Object.assign({user_agent: userAgent}, authToken);
        return new RequestMessage(
            HELLO,
            [metadata],
            () => `HELLO {user_agent: '${userAgent}', ...}`
        );
    }

    /**
     * Create a new BEGIN message.
     * @param {Bookmark} bookmark the bookmark.
     * @param {TxConfig} txConfig the configuration.
     * @param {string} database the database name.
     * @param {string} mode the access mode.
     * @return {RequestMessage} new BEGIN message.
     */
    // @todo: typings
    static begin({bookmark, txConfig, database, mode}: any = {}) {
        const metadata = buildTxMetadata(bookmark, txConfig, database, mode);

        return new RequestMessage(
            BEGIN,
            [metadata],
            () => `BEGIN ${JSON.stringify(metadata)}`
        );
    }

    /**
     * Get a COMMIT message.
     * @return {RequestMessage} the COMMIT message.
     */
    static commit() {
        return COMMIT_MESSAGE;
    }

    /**
     * Get a ROLLBACK message.
     * @return {RequestMessage} the ROLLBACK message.
     */
    static rollback() {
        return ROLLBACK_MESSAGE;
    }

    /**
     * Create a new RUN message with additional metadata.
     * @param {string} query the cypher query.
     * @param {Object} parameters the query parameters.
     * @param {Bookmark} bookmark the bookmark.
     * @param {TxConfig} txConfig the configuration.
     * @param {string} database the database name.
     * @param {string} mode the access mode.
     * @return {RequestMessage} new RUN message with additional metadata.
     */
    static runWithMetadata(
        query: string,
        parameters: any,
        // @todo: typings
        {bookmark, txConfig, database, mode}: any = {}
    ) {
        const metadata = buildTxMetadata(bookmark, txConfig, database, mode);

        return new RequestMessage(
            RUN,
            [query, parameters, metadata],
            () =>
                `RUN ${query} ${JSON.stringify(parameters)} ${JSON.stringify(metadata)}`
        );
    }

    /**
     * Get a GOODBYE message.
     * @return {RequestMessage} the GOODBYE message.
     */
    static goodbye() {
        return GOODBYE_MESSAGE;
    }

    /**
     * Generates a new PULL message with additional metadata.
     * @param {Integer|number} stmtId
     * @param {Integer|number} n
     * @return {RequestMessage} the PULL message.
     */
    // @todo: typings
    static pull({stmtId = NO_STATEMENT_ID, n = ALL}: any = {}) {
        const metadata = buildStreamMetadata(stmtId || NO_STATEMENT_ID, n || ALL);

        return new RequestMessage(
            PULL,
            [metadata],
            () => `PULL ${JSON.stringify(metadata)}`
        );
    }

    /**
     * Generates a new DISCARD message with additional metadata.
     * @param {Integer|number} stmtId
     * @param {Integer|number} n
     * @return {RequestMessage} the PULL message.
     */
    // @todo: typings
    static discard({stmtId = NO_STATEMENT_ID, n = ALL}: any = {}) {
        const metadata = buildStreamMetadata(stmtId || NO_STATEMENT_ID, n || ALL);

        return new RequestMessage(
            DISCARD,
            [metadata],
            () => `DISCARD ${JSON.stringify(metadata)}`
        );
    }
}

// constants for messages that never change
// @todo: move?
export const PULL_ALL_MESSAGE = new RequestMessage(PULL_ALL, [], () => 'PULL_ALL');
export const RESET_MESSAGE = new RequestMessage(RESET, [], () => 'RESET');
export const COMMIT_MESSAGE = new RequestMessage(COMMIT, [], () => 'COMMIT');
export const ROLLBACK_MESSAGE = new RequestMessage(ROLLBACK, [], () => 'ROLLBACK');
export const GOODBYE_MESSAGE = new RequestMessage(GOODBYE, [], () => 'GOODBYE');
