import { calendar_v3 } from 'googleapis';
import Schema$Event = calendar_v3.Schema$Event;

export function toEmptyAllDayEvent({ summary, start, end }: Schema$Event): Schema$Event {
    return {
        summary,
        start: { date: start?.dateTime ? start?.dateTime.split('T')[0] : start?.date },
        end: { date: end?.dateTime ? end?.dateTime.split('T')[0] : end?.date },
    };
}
