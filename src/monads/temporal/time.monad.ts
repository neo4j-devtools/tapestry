import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import {timeToIsoString, timeZoneOffsetToIsoString, totalNanoseconds, timeZoneOffsetInSeconds} from '../../utils/temporal.utils';

export interface RawTime {
    hour: Num;
    minute: Num;
    second: Num;
    nanosecond: Num;
    timeZoneOffsetSeconds: Num;
}

export default class TimeMonad extends Monad<RawTime> {
    static isTimeMonad(val: any): val is TimeMonad {
        return val instanceof TimeMonad;
    }

    static of(val: any) {
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

    static from(val: any) {
        return val instanceof TimeMonad
            ? val
            : TimeMonad.of(val);
    }

    isEmpty(): boolean {
        return false; // @todo
    }

    getHour() {
        return this.original.hour;
    }

    getMinute() {
        return this.original.minute;
    }

    getSecond() {
        return this.original.second;
    }

    getNanosecond() {
        return this.original.nanosecond;
    }

    getTimeZoneOffsetSeconds() {
        return this.original.timeZoneOffsetSeconds;
    }

    static fromStandardDate (standardDate: Date, nanosecond: number) {
        return TimeMonad.of({
            hour: standardDate.getHours(),
            minute: standardDate.getMinutes(),
            second: standardDate.getSeconds(),
            nanosecond: totalNanoseconds(standardDate, nanosecond),
            timeZoneOffsetInSeconds: timeZoneOffsetInSeconds(standardDate)
        })
    }

    toString () {
        return (
            timeToIsoString(
                this.getHour(),
                this.getMinute(),
                this.getSecond(),
                this.getNanosecond()
            ) + timeZoneOffsetToIsoString(this.getTimeZoneOffsetSeconds())
        )
    }
}
