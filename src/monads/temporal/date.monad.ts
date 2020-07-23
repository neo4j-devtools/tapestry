import moment from 'moment';
import {Monad} from '@relate/types';

import CypherNum from '../cypher-num/cypher-num.monad';
import {dateToIsoString} from '../../utils/temporal.utils';

export interface RawDate {
    year: CypherNum;
    month: CypherNum;
    day: CypherNum;
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
            year: CypherNum.fromValue(val.year),
            month: CypherNum.fromValue(val.month),
            day: CypherNum.fromValue(val.day),
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

    static fromMessage(days: CypherNum = CypherNum.ZERO): DateMonad {
        return days.flatMap((no) => DateMonad.fromStandardDate(moment(0).add(no, 'days').toDate()));
    }

    toString() {
        return `${dateToIsoString(this.year, this.month, this.day)}`;
    }
}
