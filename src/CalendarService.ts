import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import Schema$Event = calendar_v3.Schema$Event;
import Calendar = calendar_v3.Calendar;
import { log as defaultLog } from 'apify';

const log = defaultLog.child({ prefix: 'CalendarService' });

export interface CalendarService {
    fetchOooEvents: (calendarId: string, timeMin: Date, timeMax: Date) => Promise<Schema$Event[]>;

    queryEvents: (calendarId: string, query: string, timeMin: Date, timeMax: Date) => Promise<Schema$Event[]>;

    addEvents: (calendarId: string, events: Schema$Event[]) => Promise<void>;

    deleteEvents: (calendarId: string, events: Schema$Event[]) => Promise<void>;
}

class DefaultCalendarService implements CalendarService {
    private api: Calendar;

    constructor(api: Calendar) {
        this.api = api;
    }

    async fetchOooEvents(calendarId: string, timeMin: Date, timeMax: Date): Promise<Schema$Event[]> {
        // TODO: Implement pagination
        const res = await this.api.events.list({
            calendarId: calendarId,
            eventTypes: ['outOfOffice'],
            singleEvents: true,
            orderBy: 'startTime',
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
        });
        return res.data.items || [];
    }

    async queryEvents(calendarId: string, query: string, timeMin: Date, timeMax: Date): Promise<Schema$Event[]> {
        const res = await this.api.events.list({
            calendarId: calendarId,
            q: query,
            singleEvents: true,
            orderBy: 'startTime',
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
        });
        return res.data.items || [];
    }

    async addEvents(calendarId: string, events: Schema$Event[]) {
        // TODO: Implement batch insert
        for (const event of events) {
            log.debug("Adding event", { event: event.summary, start: event.start?.date });
            await this.api.events.insert({ calendarId, requestBody: event });
        }
    }

    async deleteEvents(calendarId: string, events: Schema$Event[]) {
        // TODO: Implement batch delete
        for (const event of events) {
            log.debug("Removing event", { event: event.summary, start: event.start?.date });
            await this.api.events.delete({ calendarId, eventId: event.id!! });
        }
    }
}

export function createCalendarService(oAuthClient: OAuth2Client): CalendarService {
    const calendar = google.calendar({ version: 'v3', auth: oAuthClient });
    return new DefaultCalendarService(calendar);
}
