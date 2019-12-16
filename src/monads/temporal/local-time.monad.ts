import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import {timeToIsoString, totalNanoseconds} from '../../utils/temporal.utils';

export interface RawLocalTime {
    hour: Num;
    minute: Num;
    second: Num;
    nanosecond: Num;
}

export default class LocalTime extends Monad<RawLocalTime> {
    static isLocalTime(val: any): val is LocalTime {
        return val instanceof LocalTime;
    }

    static of(val: any) {
        // @todo: improve typechecks
        const sane: RawLocalTime = {
            hour: Num.fromValue(val.hour),
            minute: Num.fromValue(val.minute),
            second: Num.fromValue(val.second),
            nanosecond: Num.fromValue(val.nanosecond),
        };

        return new LocalTime(sane);
    }

    static from(val: any) {
        return val instanceof LocalTime
            ? val
            : LocalTime.of(val);
    }

    /**
     * Create a {@link LocalTime} object from the given standard JavaScript `Date` and optional nanoseconds.
     * Year, month, day and time zone offset components of the given date are ignored.
     * @param {global.Date} standardDate - The standard JavaScript date to convert.
     * @param {Integer|number|undefined} nanosecond - The optional amount of nanoseconds.
     * @return {LocalTime} New LocalTime.
     */
    static fromStandardDate(standardDate: Date, nanosecond: Num) {
        return LocalTime.of({
            hour: standardDate.getHours(),
            minute: standardDate.getMinutes(),
            second: standardDate.getSeconds(),
            nanosecond: totalNanoseconds(standardDate, nanosecond)
        });
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

    toString() {
        return timeToIsoString(
            this.original.hour,
            this.original.minute,
            this.original.second,
            this.original.nanosecond
        );
    }
}
