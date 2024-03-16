import { calendar_v3 } from 'googleapis';
import Schema$Event = calendar_v3.Schema$Event;

/** Fake implementation of Google Calendar V3 API */
export default class GoogleCalendarFake {
    readonly events: GoogleEventsFake;

    constructor(pageSize: number = 100) {
        this.events = new GoogleEventsFake(pageSize);
    }
}

class GoogleEventsFake {
    // Map calendarId => events
    private readonly calendars: Map<string, Schema$Event[]> = new Map();

    constructor(readonly pageSize: number) {}

    async list(request: { calendarId: string, query?: string, pageToken?: string }) {
        if (!request.calendarId) {
            throw new Error('calendarId is required');
        }

        let allItems = this.getEvents(request.calendarId);

        // Filtering
        if (request.query) {
            allItems = allItems.filter(event => event.summary?.includes(request.query!))
        }

        // TODO: Support eventType to filter out-of-office events only

        // Pagination
        const startIndex = request.pageToken ? Number.parseInt(request.pageToken) : 0;
        const nextStartIndex = startIndex + this.pageSize;
        const items = allItems.slice(startIndex, nextStartIndex);

        const nextPageToken = allItems.length > nextStartIndex ? nextStartIndex.toString() : null;

        return {
            data: { items, nextPageToken }
        }
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
