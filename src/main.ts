import { Actor, log } from 'apify';
import { google } from 'googleapis';
import * as process from 'process';
import ow from 'ow';

// @ts-ignore
import { apifyGoogleAuth } from './google-auth/main.js';
import { owCheck } from './utils/owCheck.js';

const { calendar } = google;

await Actor.init();

(async () => {
    const credentials = {
        client_id: owCheck(process.env.OAUTH2_CLIENT_ID, 'OAUTH2_CLIENT_ID', ow.string.nonEmpty) as string,
        client_secret: owCheck(process.env.OAUTH2_CLIENT_SECRET, 'OAUTH2_CLIENT_SECRET', ow.string.nonEmpty) as string,
        redirect_uri: owCheck(process.env.OAUTH2_REDIRECT_URI, 'OAUTH2_REDIRECT_URI', ow.string.nonEmpty) as string,
    }

    const oAuthClient = await apifyGoogleAuth({
        credentials,
        scope: 'calendar'
    });

    const calendarId = 'tobias.potocek@apify.com';
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const response = await calendar('v3').events.list({
        auth: oAuthClient,
        calendarId: calendarId,
        timeMin: oneWeekAgo.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
    });

    if (!response?.data?.items) {
        log.error('Response returned no events', response);
        return
    }

    const events = response.data.items.map((item: any) => ({
        id: item.id,
        name: item.summary,
        startDate: item.start.dateTime || item.start.date,
    }));

    await Actor.pushData(events);
    log.info('Events successfully pushed');

    await Actor.exit();
})();
