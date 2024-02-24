import { calendar_v3 } from 'googleapis';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

type Schema$Event = calendar_v3.Schema$Event;

type Weekday = 'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'|'Sunday';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

dayjs.extend(isoWeek);
dayjs.extend(utc);
dayjs.extend(customParseFormat); // Required to parse the today param.

function checkWeekDay(day: string) {
    if (!WEEKDAYS.includes(day)) {
        throw Error(`Invalid weekday: ${day}`);
    }
}

function getIsoWeekday(day: Weekday) {
    return (WEEKDAYS.indexOf(day) + 1) % 7;
}

function checkTime(time: string) {
    if (!/^\d{2}:\d{2}$/.test(time)) {
        throw Error(`Invalid time: ${time}`);
    }
}

/**
 * Helper for building test events.
 *
 * Its API is relying on weekdays rather than actual dates as for its use cases it's sufficient and more convenient.
 */
export class EventBuilder {
    private readonly summary?: string;
    private readonly today: string;

    private fromDay?: Weekday;
    private toDay?: Weekday;
    private fromTime?: string;
    private toTime?: string;

    /**
     * @param today The date to be used as the reference point for the workdays. E.g. when you are creating an event on
     *     Monday, it'll find the next Monday (including today). It should be in the format "YYYY-MM-DD".
     * @param summary The summary of the event.
     */
    constructor(today: string, summary?: string) {
        this.summary = summary;
        this.today = today;
    }

    on(day: Weekday): this {
        this.fromDay = day;
        this.toDay = day; // For single day events
        return this;
    }

    from(dayOrTime: Weekday|string, time?: string): this {
        if (time) {
            checkWeekDay(dayOrTime);
            checkTime(time);
            this.fromDay = dayOrTime as Weekday;
            this.fromTime = time;
        } else {
            if (WEEKDAYS.includes(dayOrTime)) {
                this.fromDay = dayOrTime as Weekday;
            } else {
                checkTime(dayOrTime);
                this.fromTime = dayOrTime;
            }
        }
        return this;
    }

    /**
     * Set the end of the event. For multi-day events, it's inclusive (e.g., from Monday to Friday includes both days).
     */
    to(dayOrTime: Weekday|string, time?: string): this {
        if (time) {
            checkWeekDay(dayOrTime);
            checkTime(time);
            this.toDay = dayOrTime as Weekday;
            this.toTime = time;
        } else {
            if (WEEKDAYS.includes(dayOrTime)) {
                this.toDay = dayOrTime as Weekday;
            } else {
                checkTime(dayOrTime);
                this.toTime = dayOrTime;
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

        // Using UTC prevents local timezone from getting into the way when setting event times.
        const today = dayjs.utc(this.today, 'YYYY-MM-DD');

        if (!today.isValid()) {
            throw Error(`Failed to parse the today date. Expected YYYY-MM-DD. Received: ${this.today}`);
        }

        function findNextWeekDay(day: Weekday) {
            let next = today.isoWeekday(getIsoWeekday(day));
            if (next.isBefore(today)) {
                next = next.add(1, 'week');
            }
            return next;
        }

        let startDay = this.fromDay ? findNextWeekDay(this.fromDay) : today;
        let endDay = this.toDay ? findNextWeekDay(this.toDay) : startDay;


        if (this.fromTime) {
            const [startHour, startMinute] = this.fromTime.split(':').map(Number);
            startDay = startDay.hour(startHour).minute(startMinute);
            event.start!!.dateTime = startDay.toISOString();
        } else {
            event.start!!.date = startDay.format('YYYY-MM-DD');
        }

        if (this.toTime) {
            const [endHour, endMinute] = this.toTime.split(':').map(Number);
            // Adjust for end time being on the next day (e.g., party scenario)
            let adjustDay = this.fromDay === this.toDay && endHour < startDay.hour() ? 1 : 0;
            endDay = endDay.add(adjustDay, 'day').hour(endHour).minute(endMinute);
            event.end!!.dateTime = endDay.toISOString();
        } else {
            // For all-day events, the end date is exclusive
            event.end!.date = endDay.add(1, 'day').format('YYYY-MM-DD');
        }

        return event;
    }
}
