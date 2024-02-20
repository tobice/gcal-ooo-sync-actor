import { GoogleAuthCredentials } from './google-auth/types.js';
import { CalendarService, createCalendarService } from './CalendarService.js';
import { apifyGoogleAuth } from './google-auth/main.js';
import { log as defaultLog } from 'apify';
import { eventKey } from './utils/eventKey.js';
import { calendar_v3 } from 'googleapis';
import Schema$Event = calendar_v3.Schema$Event;
import { toEmptyAllDayEvent } from './utils/toEmptyAllDayEvent.js';

const log = defaultLog.child({ prefix: 'SyncService' });

class SyncService {
    private readonly calendarService: CalendarService

    constructor(calendarService: CalendarService) {
        this.calendarService = calendarService;
    }

    /**
     * Synchronizes events from source calendar to target calendar using Google Calendar API.
     *
     * For each Out-of-office event in the source calendar, it creates a corresponding event in the target calendar.
     * The created event is always all-day (the time information is dropped). The event's title is the same as the
     * source event's title, but it's prefixed with displayName. Events in the target calendar that no longer exist in
     * the source calendar are deleted. Events that were changed in the source calendar are updated in the target
     * calendar.
     */
    async sync(sourceCalendarId: string, targetCalendarId: string, displayName: string) {
        log.info('Syncing calendar', { sourceCalendarId, targetCalendarId, displayName });

        const oooEvents = await this.calendarService.fetchOooEvents(sourceCalendarId);

        const existingTargetEvents = (await this.calendarService.queryEvents(targetCalendarId, displayName))
            // Querying by display name might return some false positives as Google Calendar API searches for the
            // display name in all fields.
            .filter(event => event.summary?.startsWith(`${displayName}: `));

        const expectedTargetEvents = oooEvents.map(event =>
            toEmptyAllDayEvent({
                ...event,
                summary: `${displayName}: ${event.summary}`,
            }));

        const existingTargetEventsMap = new Map(existingTargetEvents.map(event => [eventKey(event), event]));

        const eventsToAdd: Schema$Event[] = [];
        expectedTargetEvents.forEach(event => {
            if (existingTargetEventsMap.has(eventKey(event))) {
                existingTargetEventsMap.delete(eventKey(event));
            } else {
                eventsToAdd.push(event);
            }
        });

        const eventsToDelete: Schema$Event[] = Array.from(existingTargetEventsMap.values());

        await this.calendarService.addEvents(targetCalendarId, eventsToAdd);
        await this.calendarService.deleteEvents(targetCalendarId, eventsToDelete);

        log.info('Calendar synced', {
            sourceCalendarId,
            addedEvents: eventsToAdd.length,
            deletedEvents: eventsToDelete.length
        });
    }
}

export async function createSyncService(credentials: GoogleAuthCredentials) {
    const oAuthClient = await apifyGoogleAuth({
        credentials,
        scope: 'calendar'
    });
    return new SyncService(createCalendarService(oAuthClient));
}
