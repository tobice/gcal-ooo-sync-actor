import { calendar_v3 } from 'googleapis';
import Schema$Event = calendar_v3.Schema$Event;

export function eventKey(event: Schema$Event): string {
    return `${event.start?.dateTime || event.start?.date}-${event.end?.dateTime || event.end?.date}-${event.summary}`;
}
