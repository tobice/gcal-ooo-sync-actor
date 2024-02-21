import { Actor, log } from 'apify';
import * as process from 'process';
import ow from 'ow';
import { owCheck } from './utils/owCheck.js';
import { getActorInput } from './utils/getActorInput.js';
import { createSyncService } from './SyncService.js';

await Actor.init();

(async () => {
    const input = await getActorInput();
    log.info('Actor input', { input });

    const displayNameOverrides = new Map(input.displayNameOverrides.map(({ key, value }) => [key, value]));

    // TODO: Check that display names do not conflict

    const credentials = {
        client_id: owCheck(process.env.OAUTH2_CLIENT_ID, 'OAUTH2_CLIENT_ID', ow.string.nonEmpty) as string,
        client_secret: owCheck(process.env.OAUTH2_CLIENT_SECRET, 'OAUTH2_CLIENT_SECRET', ow.string.nonEmpty) as string,
        redirect_uri: owCheck(process.env.OAUTH2_REDIRECT_URI, 'OAUTH2_REDIRECT_URI', ow.string.nonEmpty) as string,
    }

    const syncService = await createSyncService(credentials, input.daysToSync);

    for (const sourceCalendarId of input.sourceCalendarIds) {
        const displayName = displayNameOverrides.get(sourceCalendarId) ?? sourceCalendarId.split('@')[0];
        await syncService.sync(sourceCalendarId, input.targetCalendarId, displayName);
    }

    await Actor.exit();
})();
