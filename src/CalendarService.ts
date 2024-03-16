import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import Schema$Event = calendar_v3.Schema$Event;
import Calendar = calendar_v3.Calendar;
import { log as defaultLog } from 'apify';
import Params$Resource$Events$List = calendar_v3.Params$Resource$Events$List;
import { AxiosError } from "axios";


const log = defaultLog.child({ prefix: 'CalendarService' });

export interface CalendarService {
    fetchOooEvents: (calendarId: string, timeMin: Date, timeMax: Date) => Promise<Schema$Event[]>;

    queryEvents: (calendarId: string, query: string, timeMin: Date, timeMax: Date) => Promise<Schema$Event[]>;

    addEvents: (calendarId: string, events: Schema$Event[]) => Promise<void>;

    deleteEvents: (calendarId: string, events: Schema$Event[]) => Promise<void>;
}

export class CalendarServiceError extends Error {
    public readonly causeError?: any;

    constructor(
        message: string,
        public readonly params: object,
        public readonly cause: any,
    ) {
        super(message);
        this.params = params;
        this.cause = cause;

        // In case it's an (G)AxiosError, we can extract the response data.
        if (cause.response?.data?.error) {
            this.causeError = cause.response?.data;
        }
    }
}

class DefaultCalendarService implements CalendarService {
    private api: Calendar;

    constructor(api: Calendar) {
        this.api = api;
    }

    async fetchOooEvents(calendarId: string, timeMin: Date, timeMax: Date): Promise<Schema$Event[]> {
       return this.listAll({
            calendarId: calendarId,
            eventTypes: ['outOfOffice'],
            singleEvents: true,
            orderBy: 'startTime',
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
        });
    }

    async queryEvents(calendarId: string, query: string, timeMin: Date, timeMax: Date): Promise<Schema$Event[]> {
        return this.listAll({
            calendarId: calendarId,
            q: query,
            singleEvents: true,
            orderBy: 'startTime',
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
        });
    }

    /** Helper that implements pagination to fetch all events using list() */
    private async listAll(params: Params$Resource$Events$List): Promise<Schema$Event[]> {
        let events: Schema$Event[] = [];
        let pageToken: string | null | undefined = null; // Stupid Google API types 🤷

        do {
            try {
                const newParams = { ...params }
                if (pageToken) {
                    newParams.pageToken = pageToken;
                }

                const response = await this.api.events.list(newParams);

                events = events.concat(response.data.items || []);
                pageToken = response.data.nextPageToken;
            } catch (e) {
                throw new CalendarServiceError('Failed to list events', params, e as Error);
            }
        } while (pageToken);

        return events;
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
