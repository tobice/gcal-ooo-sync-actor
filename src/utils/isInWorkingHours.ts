import { calendar_v3 } from 'googleapis';
import Schema$Event = calendar_v3.Schema$Event;
import dayjs from '../utils/dayjs.js';
import { log } from 'apify';

export interface WorkingHours {
    /** The start of the working hours in the format "HH:MM", for example 09:00 */
    start: string;

    /** The end of the working hours in the format "HH:MM", for example 17:00 */
    end: string;
}

/**
 * Returns true if the event is on a workday and overlapping with the provided working hours.
 *
 * Working hours relative to the event time zone are used.
 */
export function isInWorkingHours(event: Schema$Event, workingHours: WorkingHours): boolean {
    // Unify start/end between all-day and non-all-day events.
    let start = event.start?.date ?
        dayjs(`${event.start.date}`).startOf('day') : // Treat all-day events as starting at the beginning of the day.
        toDayjsWithUTCOffset(event.start!.dateTime!);
    const end = event.end?.date ?
        dayjs(`${event.end.date}`).startOf('day') : // Treat all-day events as starting at the beginning of the day.
        toDayjsWithUTCOffset(event.end!.dateTime!);

    function _isWorkingDay(date: dayjs.Dayjs) {
        return [0 /* = Sunday */, 6 /* = Saturday */].includes(date.day());
    }

    function _isInWorkingHours(start: dayjs.Dayjs) {
        if (_isWorkingDay(start)) {
            return false;
        }

        return start.format('HH:mm') >= workingHours.start && start.format('HH:mm') < workingHours.end;
    }

    const [hours, minutes] = workingHours.start.split(':').map(x => parseInt(x));

    function _getNextWorkStart(current: dayjs.Dayjs) {
        let next = current.startOf('day');

        // Move to the next day if work is already over, or we're on a weekend.
        if (current.format('HH:mm') >= workingHours.end || _isWorkingDay(current)) {
            next = next.add(1, 'day');
        }

        // Reset to the beginning to the working hours.
        return next.hour(hours).minute(minutes);
    }

    // Move forward the beginning of the event until we reach working hours, or the end of the event. There probably is
    // a sophisticated O(1) solution consisting of a bunch of ifs, but this is easier to understand and maintain.
    while (start.isBefore(end) && !_isInWorkingHours(start)) {
        start = _getNextWorkStart(start);
    }

    return start.isBefore(end);
}

/**
 * Converts an RFC 3339 formatted string into a dayjs object.
 *
 * The conversion preserves the original timezone by explicitly setting the UTC offset (dayjs doesn't do that out of
 * the box). This is necessary for .format('HH:mm') to return local time that can be compared to working hours.
 */
function toDayjsWithUTCOffset(dateTime: string): dayjs.Dayjs {
    let d = dayjs(dateTime);

    const utcOffset = extractUTCOffset(dateTime);

    if (!utcOffset) {
        log.warning('Unable to extract UTC offset; detecting working hours might not work', { dateTime });
        return d;
    }

    return d.utcOffset(utcOffset);
}

function extractUTCOffset(dateTime: string) {
    const regex = /(Z|([+-])(\d{2}):?(\d{2}))/;
    const matches = dateTime.match(regex);

    if (matches) {
        // If 'Z', return it directly; otherwise, construct the offset string
        return matches[0] === 'Z' ? 'Z' : `${matches[2]}${matches[3]}:${matches[4]}`;
    } else {
        return null; // No offset found
    }
}
