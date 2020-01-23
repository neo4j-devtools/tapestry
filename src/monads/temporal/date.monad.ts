import moment from 'moment';

import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import {dateToIsoString} from '../../utils/temporal.utils';

export interface RawDate {
    year: Num;
    month: Num;
    day: Num;
}

export default class DateMonad extends Monad<RawDate> {
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

    static isDateMonad(val: any): val is DateMonad {
        return val instanceof DateMonad;
    }

    static of(val: any): DateMonad {
        // @todo: improve typechecks
        const sane: RawDate = {
            year: Num.fromValue(val.year),
            month: Num.fromValue(val.month),
            day: Num.fromValue(val.day),
        };

        return new DateMonad(sane);
    }

    static from(val: any): DateMonad {
        return DateMonad.isDateMonad(val)
            ? val
            : DateMonad.of(val);
    }

    static fromStandardDate(standardDate: Date): DateMonad {
        return DateMonad.of({
            year: standardDate.getFullYear(),
            month: standardDate.getMonth() + 1,
            day: standardDate.getDate()
        });
    }

    static fromMessage(days: Num = Num.ZERO): DateMonad {
        return days.flatMap((no) => DateMonad.fromStandardDate(moment(0).add(no, 'days').toDate()));
    }

    toString() {
        return `${dateToIsoString(this.year, this.month, this.day)}`;
    }
}
