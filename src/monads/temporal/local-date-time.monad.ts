import moment from 'moment';
import {Monad} from '@relate/types';

import CypherNum from '../cypher-num/cypher-num.monad';
import {localDateTimeToString, totalNanoseconds} from '../../utils/temporal.utils';

export interface RawLocalDateTime {
    year: CypherNum;
    month: CypherNum;
    day: CypherNum;
    hour: CypherNum;
    minute: CypherNum;
    second: CypherNum;
    nanosecond: CypherNum;
}

export default class LocalDateTime extends Monad<RawLocalDateTime> {
    get isEmpty(): boolean {
        return false; // @todo
    }

    get year() {
        return this.original.year;
    }

    get month() {
        return this.original.month;
    }

    get day() {
        return this.original.day;
    }

    get hour() {
        return this.original.hour;
    }

    get minute() {
        return this.original.minute;
    }

    get second() {
        return this.original.second;
    }

    get nanosecond() {
        return this.original.nanosecond;
    }

    static isLocalDateTime(val: any): val is LocalDateTime {
        return val instanceof LocalDateTime;
    }

    static of(val: any): LocalDateTime {
        // @todo: improve typechecks
        const sane: RawLocalDateTime = {
            year: CypherNum.fromValue(val.year),
            month: CypherNum.fromValue(val.month),
            day: CypherNum.fromValue(val.day),
            hour: CypherNum.fromValue(val.hour),
            minute: CypherNum.fromValue(val.minute),
            second: CypherNum.fromValue(val.second),
            nanosecond: CypherNum.fromValue(val.nanosecond)
        };

        return new LocalDateTime(sane);
    }

    static from(val: any): LocalDateTime {
        return LocalDateTime.isLocalDateTime(val)
            ? val
            : LocalDateTime.of(val);
    }

    static fromStandardDate(standardDate: Date, nanosecond: CypherNum): LocalDateTime {
        return LocalDateTime.of({
            year: standardDate.getFullYear(),
            month: standardDate.getMonth() + 1,
            day: standardDate.getDate(),
            hour: standardDate.getHours(),
            minute: standardDate.getMinutes(),
            second: standardDate.getSeconds(),
            nanosecond: totalNanoseconds(standardDate, nanosecond)
        });
    }

    static fromMessage(seconds: CypherNum = CypherNum.ZERO, nanoseconds: CypherNum = CypherNum.ZERO): LocalDateTime {
        return seconds.flatMap((secs) => LocalDateTime.fromStandardDate(
            moment(0).add(secs, 'seconds').toDate(),
            nanoseconds
        ));
    }

    toString() {
        return localDateTimeToString(
            this.year,
            this.month,
            this.day,
            this.hour,
            this.minute,
            this.second,
            this.nanosecond
        );
    }
}
