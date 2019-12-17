import {ACCESS_MODES} from '../driver/driver.constants';
import {isString} from '../../utils/string.utils';
import {NO_STATEMENT_ID, READ_MODE} from './request-message.constants';
import {Num} from '../../monads/index';

/**
 * Create an object that represent transaction metadata.
 * @param {Bookmark} bookmark the bookmark.
 * @param {TxConfig} txConfig the configuration.
 * @param {string} database the database name.
 * @param {string} mode the access mode.
 * @return {Object} a metadata object.
 */
// @todo: typings
export function buildTxMetadata(bookmark: any, txConfig: any, database: string, mode: ACCESS_MODES) {
    const metadata: any = {};
    if (!bookmark.isEmpty()) {
        metadata.bookmarks = bookmark.values();
    }

    if (txConfig.timeout) {
        metadata.tx_timeout = txConfig.timeout;
    }

    if (txConfig.metadata) {
        metadata.tx_metadata = txConfig.metadata;
    }

    if (database) {
        metadata.db = isString(database) ? database : `${database}`;
    }

    if (mode === ACCESS_MODES.READ) {
        metadata.mode = READ_MODE;
    }

    return metadata;
}

/**
 * Create an object that represents streaming metadata.
 * @param {Integer|number} stmtId The query id to stream its results.
 * @param {Integer|number} n The number of records to stream.
 * @returns {Object} a metadata object.
 */
// @todo: typings
export function buildStreamMetadata(stmtId: Num | number, n: Num | number) {
    const metadata: any = {n: Num.fromValue(n)};

    if (stmtId !== NO_STATEMENT_ID) {
        metadata.qid = Num.fromValue(stmtId);
    }

    return metadata;
}
