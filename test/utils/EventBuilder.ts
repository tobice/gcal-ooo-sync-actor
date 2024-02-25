import { calendar_v3 } from 'googleapis';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import timezone from 'dayjs/plugin/timezone.js';

type Schema$Event = calendar_v3.Schema$Event;

type Weekday = 'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'|'Sunday';

dayjs.extend(isoWeek);
dayjs.extend(utc);
dayjs.extend(customParseFormat); // Required to parse the today param.
dayjs.extend(timezone);

/** Helper for building test events. */
export class EventBuilder {
    private readonly today: string;
    private readonly timezone: string;

    private readonly summary?: string;
    private fromDay?: Weekday|string;
    private toDay?: Weekday|string;
    private fromTime?: string;
    private toTime?: string;

    /**
     * @param summary The summary of the event.
     * @param today The date to be used as the reference point for the workdays. E.g. when you are creating an event on
     *     Monday, it'll find the next Monday (including today). It should be in the format "YYYY-MM-DD".
     * @param timezone
     *
     */
    constructor(summary?: string, today: string = dayjs().format('YYYY-MM-DD'), timezone = 'Europe/Prague') {
        this.summary = summary;
        this.today = checkDate(today);
        this.timezone = timezone;
    }

    on(day: Weekday|string): this {
        this.fromDay = checkWeekdayOrDate(day);
        this.toDay = checkWeekdayOrDate(day); // For single day events
        return this;
    }

    from(dayOrTime: Weekday|string, time?: string): this {
        if (time) {
            this.fromDay = checkWeekdayOrDate(dayOrTime);
            this.fromTime = checkTime(time);
        } else {
            if (isWeekdayOrDate(dayOrTime)) {
                this.fromDay = dayOrTime;
            } else {
                this.fromTime = checkTime(dayOrTime);
            }
        }
        return this;
    }

    /**
     * Set the end of the event.
     *
     * Note: Unlike Google Calendar Event itself, the end is inclusive for multi-day events. For example, from
     * Monday to Friday includes both days.
     */
    to(dayOrTime: Weekday|string, time?: string): this {
        if (time) {
            this.toDay = checkWeekdayOrDate(dayOrTime);
            this.toTime = checkTime(time);
        } else {
            if (isWeekdayOrDate(dayOrTime)) {
                this.toDay = dayOrTime;
            } else {
                this.toTime = checkTime(dayOrTime);
            }
        }
        return this;
    }

    toEvent(): Schema$Event {
        const event: Schema$Event = {
            summary: this.summary ?? 'Test event',
            start: {},
            end: {},
        };

        const today = toDayJs(this.today, this.timezone);

        let start = this.fromDay
            ? isWeekday(this.fromDay)
                ? findNextWeekday(today, this.fromDay as Weekday)
                : toDayJs(this.fromDay, this.timezone)
            : today;

        let end = this.toDay
            ? isWeekday(this.toDay)
                ? findNextWeekday(today, this.toDay as Weekday)
                : toDayJs(this.toDay, this.timezone)
            : today;

        if (this.fromTime) {
            const [startHour, startMinute] = this.fromTime.split(':').map(Number);
            start = start.hour(startHour).minute(startMinute);
            event.start!!.dateTime = start.format();
        } else {
            event.start!!.date = start.format('YYYY-MM-DD');
        }

        if (this.toTime) {
            const [endHour, endMinute] = this.toTime.split(':').map(Number);
            // Adjust for end time being on the next day (e.g., party scenario)
            let adjustDay = this.fromDay === this.toDay && endHour < start.hour() ? 1 : 0;
            end = end.add(adjustDay, 'day').hour(endHour).minute(endMinute);
            event.end!!.dateTime = end.format();
        } else {
            // For all-day events, the end date is exclusive
            event.end!.date = end.add(1, 'day').format('YYYY-MM-DD');
        }

        return event;
    }
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getWeekday(day: Weekday): number {
    return (WEEKDAYS.indexOf(day) + 1) % 7;
}

function isWeekday(day: string): boolean {
    return WEEKDAYS.includes(day);
}

function isDate(date: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function checkDate(date: string) {
    if (!isDate(date)) {
        throw Error(`Invalid date: ${date}. Expected format: YYYY-MM-DD`);
    }

    return date;
}

function isWeekdayOrDate(day: string): boolean {
    return isWeekday(day) || isDate(day);
}

function checkWeekdayOrDate(day: string): Weekday|string {
    if (!isWeekdayOrDate(day)) {
        throw Error(`Expected either valid weekday or a date: ${day}`);
    }

    return isWeekday(day) ? day as Weekday : day;
}

function isTime(time: string): boolean {
    return /^\d{2}:\d{2}$/.test(time);
}

function checkTime(time: string) {
    if (!isTime(time)) {
        throw Error(`Invalid time: ${time}. Expected format: HH:MM`);
    }

    return time;
}

function toDayJs(date: string, timezone: string): dayjs.Dayjs {
    const result = dayjs.tz(checkDate(date), 'YYYY-MM-DD', timezone).startOf('day');

    if (!result.isValid()) {
        throw Error(); // Shouldn't really happen
    }

    return result;
}

function findNextWeekday(today: dayjs.Dayjs, day: Weekday) {
    let next = today.isoWeekday(getWeekday(day));
    if (next.isBefore(today)) {
        next = next.add(1, 'week');
    }
    return next;
}


