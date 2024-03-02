import { calendar_v3 } from 'googleapis';
import Schema$Event = calendar_v3.Schema$Event;

/** Fake implementation of Google Calendar V3 API */
export default class GoogleCalendarFake {
    events = new GoogleEventsFake();
}

class GoogleEventsFake {
    // Map calendarId => events
    private readonly calendars: Map<string, Schema$Event[]> = new Map();

    async list(request: { calendarId: string }) {
        return {
            data: {
                items: this.getEvents(request.calendarId)
            }
        }
    }

    async delete() {
        // TODO: Implement
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
