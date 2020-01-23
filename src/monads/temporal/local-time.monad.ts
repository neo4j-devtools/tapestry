import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import {timeToIsoString, totalNanoseconds} from '../../utils/temporal.utils';
import moment from 'moment';

export interface RawLocalTime {
    hour: Num;
    minute: Num;
    second: Num;
    nanosecond: Num;
}

export default class LocalTime extends Monad<RawLocalTime> {
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

    static isLocalTime(val: any): val is LocalTime {
        return val instanceof LocalTime;
    }

    static of(val: any): LocalTime {
        // @todo: improve typechecks
        const sane: RawLocalTime = {
            hour: Num.fromValue(val.hour),
            minute: Num.fromValue(val.minute),
            second: Num.fromValue(val.second),
            nanosecond: Num.fromValue(val.nanosecond),
        };

        return new LocalTime(sane);
    }

    static from(val: any): LocalTime {
        return LocalTime.isLocalTime(val)
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
    static fromStandardDate(standardDate: Date, nanosecond: Num): LocalTime {
        return LocalTime.of({
            hour: standardDate.getHours(),
            minute: standardDate.getMinutes(),
            second: standardDate.getSeconds(),
            nanosecond: totalNanoseconds(standardDate, nanosecond)
        });
    }

    static fromMessage(seconds: Num = Num.ZERO): LocalTime {
        return seconds.divide(1000000000).flatMap((secs) => LocalTime.fromStandardDate(
            moment(0).add(secs, 'seconds').toDate(),
            Num.ZERO // @todo: more
        ));
    }

    toString() {
        return timeToIsoString(
            this.hour,
            this.minute,
            this.second,
            this.nanosecond
        );
    }
}
