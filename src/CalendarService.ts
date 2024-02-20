import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import Schema$Event = calendar_v3.Schema$Event;
import Calendar = calendar_v3.Calendar;


class CalendarService {
    private api: Calendar;

    constructor(api: Calendar) {
        this.api = api;
    }

    async fetchEvents(calendarId: string): Promise<Schema$Event[]> {
        const res = await this.api.events.list({ calendarId: calendarId });
        return res.data.items || [];
    }
}

export function createCalendarService(oAuthClient: OAuth2Client) {
    const calendar = google.calendar({ version: 'v3', auth: oAuthClient });
    return new CalendarService(calendar);
}
