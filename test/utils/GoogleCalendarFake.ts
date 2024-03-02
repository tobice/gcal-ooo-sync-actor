import { calendar_v3 } from 'googleapis';
import Schema$Event = calendar_v3.Schema$Event;

/** Fake implementation of Google Calendar V3 API */
export default class GoogleCalendarFake {
    events = new GoogleEventsFake();
}

class GoogleEventsFake {
    // Map calendarId => events
    private readonly calendars: Map<string, Schema$Event[]> = new Map();

    async list(request: { calendarId: string, query?: string }) {
        let items = this.getEvents(request.calendarId);

        if (request.query) {
            items = items.filter(event => event.summary?.includes(request.query!))
        }

        // TODO: Support eventType to filter out-of-office events only

        return { data: { items } }
    }

    async delete(request: { calendarId: string, eventId: string }) {
        const events = this.getEvents(request.calendarId);
        const index = events.findIndex(event => event.id === request.eventId);
        if (index >= 0) {
            events.splice(index, 1);
        }
    }

    async insert(request: { calendarId: string, requestBody: Schema$Event }) {
        this.getEvents(request.calendarId).push(request.requestBody);
    }

    private getEvents(calendarId: string): Schema$Event[] {
        if (!this.calendars.has(calendarId)) {
            this.calendars.set(calendarId, []);
        }
        return this.calendars.get(calendarId) as Schema$Event[];
    }
}
