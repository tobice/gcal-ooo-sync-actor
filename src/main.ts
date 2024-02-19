import { Actor, log } from 'apify';
import * as process from 'process';
import ow from 'ow';

// @ts-ignore
import { apifyGoogleAuth } from './google-auth/main.js';
import { owCheck } from './utils/owCheck.js';
import { createCalendarService } from './CalendarService.js';
import { getActorInput } from './utils/getActorInput.js';

await Actor.init();

(async () => {
    const input = await getActorInput();
    log.info('Actor input', { input });

    const credentials = {
        client_id: owCheck(process.env.OAUTH2_CLIENT_ID, 'OAUTH2_CLIENT_ID', ow.string.nonEmpty) as string,
        client_secret: owCheck(process.env.OAUTH2_CLIENT_SECRET, 'OAUTH2_CLIENT_SECRET', ow.string.nonEmpty) as string,
        redirect_uri: owCheck(process.env.OAUTH2_REDIRECT_URI, 'OAUTH2_REDIRECT_URI', ow.string.nonEmpty) as string,
    }

    const oAuthClient = await apifyGoogleAuth({
        credentials,
        scope: 'calendar'
    });
    const calendarService = createCalendarService(oAuthClient);

    for (const calendarId of input.sourceCalendarIds) {
        const events = await calendarService.fetchEvents(calendarId);

        const data = events.map((event) => ({
            id: event.id,
            name: event.summary,
            startDate: event.start?.dateTime || event.start?.date,
        }));

        log.info('Calendar synced', { calendarId, events: events.length });
        await Actor.pushData(data);
    }

    await Actor.exit();
})();
