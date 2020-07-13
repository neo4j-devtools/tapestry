import moment from 'moment';
import {Monad} from '@relate/types';

import CypherNum from '../cypher-num/cypher-num.monad';
import {
    timeToIsoString,
    timeZoneOffsetInSeconds,
    timeZoneOffsetToIsoString,
    totalNanoseconds
} from '../../utils/temporal.utils';

export interface RawTime {
    hour: CypherNum;
    minute: CypherNum;
    second: CypherNum;
    nanosecond: CypherNum;
    timeZoneOffsetSeconds: CypherNum;
}

// @ts-ignore
export default class TimeMonad extends Monad<RawTime> {
    get isEmpty(): boolean {
        return false; // @todo
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

    get timeZoneOffsetSeconds() {
        return this.original.timeZoneOffsetSeconds;
    }

    static isTimeMonad(val: any): val is TimeMonad {
        return val instanceof TimeMonad;
    }

    static of(val: any): TimeMonad {
        // @todo: improve typechecks
        const sane: RawTime = {
            hour: CypherNum.fromValue(val.hour),
            minute: CypherNum.fromValue(val.minute),
            second: CypherNum.fromValue(val.second),
            nanosecond: CypherNum.fromValue(val.nanosecond),
            timeZoneOffsetSeconds: CypherNum.fromValue(val.timeZoneOffsetSeconds),
        };

        return new TimeMonad(sane);
    }

    static from(val: any): TimeMonad {
        return val instanceof TimeMonad
            ? val
            : TimeMonad.of(val);
    }

    static fromStandardDate(standardDate: Date, nanosecond: CypherNum): TimeMonad {
        return TimeMonad.of({
            hour: standardDate.getHours(),
            minute: standardDate.getMinutes(),
            second: standardDate.getSeconds(),
            nanosecond: totalNanoseconds(standardDate, nanosecond),
            timeZoneOffsetInSeconds: timeZoneOffsetInSeconds(standardDate)
        });
    }

    static fromMessage(seconds: CypherNum = CypherNum.ZERO): TimeMonad {
        return seconds.divide(1000000000).flatMap((secs) => TimeMonad.fromStandardDate(
            moment(0).add(secs, 'seconds').toDate(),
            CypherNum.ZERO // @todo: more
        ));
    }

    toString() {
        return (
            timeToIsoString(
                this.hour,
                this.minute,
                this.second,
                this.nanosecond
            ) + timeZoneOffsetToIsoString(this.timeZoneOffsetSeconds)
        );
    }
}
