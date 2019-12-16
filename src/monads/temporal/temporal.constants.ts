import {ValueRange} from './value-range.class';

export const YEAR_RANGE = new ValueRange(-999999999, 999999999);
export const MONTH_OF_YEAR_RANGE = new ValueRange(1, 12);
export const DAY_OF_MONTH_RANGE = new ValueRange(1, 31);
export const HOUR_OF_DAY_RANGE = new ValueRange(0, 23);
export const MINUTE_OF_HOUR_RANGE = new ValueRange(0, 59);
export const SECOND_OF_MINUTE_RANGE = new ValueRange(0, 59);
export const NANOSECOND_OF_SECOND_RANGE = new ValueRange(0, 999999999);

export const MINUTES_PER_HOUR = 60;
export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
export const NANOS_PER_SECOND = 1000000000;
export const NANOS_PER_MILLISECOND = 1000000;
export const NANOS_PER_MINUTE = NANOS_PER_SECOND * SECONDS_PER_MINUTE;
export const NANOS_PER_HOUR = NANOS_PER_MINUTE * MINUTES_PER_HOUR;
export const DAYS_0000_TO_1970 = 719528;
export const DAYS_PER_400_YEAR_CYCLE = 146097;
export const SECONDS_PER_DAY = 86400;
