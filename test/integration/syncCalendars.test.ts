import { runActor } from '../../src/runActor.js';
import process from 'process';
import GoogleCalendarFake from '../utils/GoogleCalendarFake.js';
import { Actor } from 'apify';
import { ActorInput } from '../../src/utils/getActorInput.js';
import { EventBuilder } from '../utils/EventBuilder.js';

// Mock OAuth2Client. It can be empty as we override the whole Google API anyway
jest.mock('../../src/google-auth/main.js', () => ({
    apifyGoogleAuth: jest.fn().mockImplementation(() => {
    })
}));

// Fake Google Calendar API
let calendarFake: GoogleCalendarFake;
jest.mock('googleapis', () => ({
    google: { calendar: () => calendarFake }
}));

// Mock Actor Input
const DEFAULT_ACTOR_INPUT = {
    "displayNameOverrides": [],
    "sourceCalendarIds": [
        "tobias.potocek@apify.com"
    ],
    "targetCalendarId": "apify-vacations@group.calendar.google.com",
    "daysToSync": 60,
    "workingHoursStart": "09:00",
    "workingHoursEnd": "16:00"
};

function setActorInput(input: ActorInput) {
    jest.spyOn(Actor, 'getInput').mockImplementation(async () => input);
}

describe('syncCalendars', () => {

    beforeAll(() => {
        // Set up env variables
        jest.resetModules(); // Clears cache
        process.env.OAUTH2_CLIENT_ID = 'test_client_id.apps.googleusercontent.com';
        process.env.OAUTH2_CLIENT_SECRET = 'test_client_secret';
        process.env.OAUTH2_REDIRECT_URI = 'test_redirect_uri';
    });

    beforeEach(() => {
        calendarFake = new GoogleCalendarFake();
    });

    it('syncs an event', async () => {
        await calendarFake.events.insert({
            calendarId: "calendar_a@gmail.com",
            requestBody: new EventBuilder("OOO").on("Monday").toEvent()
        });

        setActorInput({
            ...DEFAULT_ACTOR_INPUT,
            sourceCalendarIds: ["calendar_a@gmail.com"],
        });

        expect((await calendarFake.events.list({ calendarId: "apify-vacations@group.calendar.google.com" })).data.items)
            .toHaveLength(0);

        await runActor();

        expect((await calendarFake.events.list({ calendarId: "apify-vacations@group.calendar.google.com" })).data.items)
            .toHaveLength(1);
    });
});
