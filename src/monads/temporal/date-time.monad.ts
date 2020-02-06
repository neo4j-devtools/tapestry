import moment from 'moment';

import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import Str from '../primitive/str.monad';
import None from '../primitive/none.monad';
import Maybe from '../primitive/maybe.monad';
import {
    localDateTimeToString,
    timeZoneOffsetInSeconds,
    timeZoneOffsetToIsoString,
    totalNanoseconds
} from '../../utils/temporal.utils';

export interface RawDateTime {
    year: Num;
    month: Num;
    day: Num;
    hour: Num;
    minute: Num;
    second: Num;
    nanosecond: Num;
    timeZoneOffsetSeconds: Maybe<Num>;
    timeZoneId: Maybe<Str>;
}

export default class DateTime extends Monad<RawDateTime> {
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

    get timeZoneOffsetSeconds() {
        return this.original.timeZoneOffsetSeconds;
    }

    get timeZoneId() {
        return this.original.timeZoneId;
    }

    static isDateTime(val: any): val is DateTime {
        return val instanceof DateTime;
    }

    static of(val: any): DateTime {
        // @todo: improve typechecks
        const sane: RawDateTime = {
            year: Num.fromValue(val.year),
            month: Num.fromValue(val.month),
            day: Num.fromValue(val.day),
            hour: Num.fromValue(val.hour),
            minute: Num.fromValue(val.minute),
            second: Num.fromValue(val.second),
            nanosecond: Num.fromValue(val.nanosecond),
            timeZoneOffsetSeconds: Maybe.of(
                val.timeZoneOffsetSeconds == null
                    ? None.EMPTY
                    : Num.fromValue(val.timeZoneOffsetSeconds)
            ),
            timeZoneId: Maybe.of(
                val.timeZoneId
                    ? Str.from(val.timeZoneId)
                    : None.EMPTY
            ),
        };

        return new DateTime(sane);
    }

    static from(val: any): DateTime {
        return DateTime.isDateTime(val)
            ? val
            : DateTime.of(val);
    }

    static fromStandardDate(standardDate: Date, nanosecond: Num, timeZoneId?: Str): DateTime {
        return DateTime.of({
            year: standardDate.getFullYear(),
            month: standardDate.getMonth() + 1,
            day: standardDate.getDate(),
            hour: standardDate.getHours(),
            minute: standardDate.getMinutes(),
            second: standardDate.getSeconds(),
            nanosecond: totalNanoseconds(standardDate, nanosecond),
            timeZoneOffsetSeconds: timeZoneOffsetInSeconds(standardDate),
            timeZoneId: Maybe.of(
                timeZoneId && !timeZoneId.isEmpty
                    ? timeZoneId
                    : None.EMPTY
            )
        });
    }

    static fromMessage(seconds: Num = Num.ZERO, nanoseconds: Num = Num.ZERO): DateTime {
        return seconds.flatMap((secs) => DateTime.fromStandardDate(
            moment(0).add(secs, 'seconds').toDate(),
            nanoseconds,
            None.EMPTY // @todo: more
        ));
    }

    toString() {
        const localDateTimeStr = localDateTimeToString(
            this.year,
            this.month,
            this.day,
            this.hour,
            this.minute,
            this.second,
            this.nanosecond
        );
        const zoneId = this.timeZoneId.getOrElse(Str.EMPTY);
        const timeZoneOffsetSeconds = this.timeZoneOffsetSeconds.getOrElse(Num.ZERO);
        const timeZoneStr = !zoneId.isEmpty
            ? zoneId.map((zone) => `[${zone}]`).get()
            : timeZoneOffsetToIsoString(timeZoneOffsetSeconds.get());

        return `${localDateTimeStr}${timeZoneStr}}`;
    }
}
