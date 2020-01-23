import moment from 'moment';

import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import {
    timeToIsoString,
    timeZoneOffsetInSeconds,
    timeZoneOffsetToIsoString,
    totalNanoseconds
} from '../../utils/temporal.utils';

export interface RawTime {
    hour: Num;
    minute: Num;
    second: Num;
    nanosecond: Num;
    timeZoneOffsetSeconds: Num;
}

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
            hour: Num.fromValue(val.hour),
            minute: Num.fromValue(val.minute),
            second: Num.fromValue(val.second),
            nanosecond: Num.fromValue(val.nanosecond),
            timeZoneOffsetSeconds: Num.fromValue(val.timeZoneOffsetSeconds),
        };

        return new TimeMonad(sane);
    }

    static from(val: any): TimeMonad {
        return val instanceof TimeMonad
            ? val
            : TimeMonad.of(val);
    }

    static fromStandardDate(standardDate: Date, nanosecond: Num): TimeMonad {
        return TimeMonad.of({
            hour: standardDate.getHours(),
            minute: standardDate.getMinutes(),
            second: standardDate.getSeconds(),
            nanosecond: totalNanoseconds(standardDate, nanosecond),
            timeZoneOffsetInSeconds: timeZoneOffsetInSeconds(standardDate)
        });
    }

    static fromMessage(seconds: Num = Num.ZERO): TimeMonad {
        return seconds.divide(1000000000).flatMap((secs) => TimeMonad.fromStandardDate(
            moment(0).add(secs, 'seconds').toDate(),
            Num.ZERO // @todo: more
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
