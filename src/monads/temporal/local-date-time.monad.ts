import moment from 'moment';

import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import {localDateTimeToString, totalNanoseconds} from '../../utils/temporal.utils';

export interface RawLocalDateTime {
    year: Num;
    month: Num;
    day: Num;
    hour: Num;
    minute: Num;
    second: Num;
    nanosecond: Num;
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
            year: Num.fromValue(val.year),
            month: Num.fromValue(val.month),
            day: Num.fromValue(val.day),
            hour: Num.fromValue(val.hour),
            minute: Num.fromValue(val.minute),
            second: Num.fromValue(val.second),
            nanosecond: Num.fromValue(val.nanosecond)
        };

        return new LocalDateTime(sane);
    }

    static from(val: any): LocalDateTime {
        return LocalDateTime.isLocalDateTime(val)
            ? val
            : LocalDateTime.of(val);
    }

    static fromStandardDate(standardDate: Date, nanosecond: Num): LocalDateTime {
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

    static fromMessage(seconds: Num = Num.ZERO, nanoseconds: Num = Num.ZERO): LocalDateTime {
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
