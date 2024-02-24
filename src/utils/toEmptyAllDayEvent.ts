import { calendar_v3 } from 'googleapis';
import Schema$Event = calendar_v3.Schema$Event;
import dayjs from 'dayjs';

/** Converts an event to an all-day event and strips all other information. */
export function toEmptyAllDayEvent({ summary, start, end }: Schema$Event): Schema$Event {
    // All-day events are kept as they are
    if (start?.date && end?.date) {
        return { summary, start, end };
    }

    // Normal events are converted to all-day events
    if (start?.dateTime && end?.dateTime) {
        return {
            summary,
            start: { date: dayjs(start?.dateTime).format('YYYY-MM-DD') },
            // The end is exclusive.
            end: { date: dayjs(end?.dateTime).add(1, 'day').format('YYYY-MM-DD') }
        };
    }

    throw new Error('Invalid event');
}
