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
const DEFAULT_VACATION_CALENDAR = "apify-vacations@apify.com";
const DEFAULT_SOURCE_CALENDAR = "tobias.potocek@apify.com";
const DEFAULT_ACTOR_INPUT = {
    "displayNameOverrides": [],
    "sourceCalendarIds": [
        DEFAULT_SOURCE_CALENDAR
    ],
    "targetCalendarId": DEFAULT_VACATION_CALENDAR,
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

    it('syncs a new event to the vacation calendar', async () => {
        await calendarFake.events.insert({
            calendarId: DEFAULT_SOURCE_CALENDAR,
            requestBody: new EventBuilder("OOO").on("Monday").toEvent()
        });

        setActorInput(DEFAULT_ACTOR_INPUT);

        await runActor();

        expect((await calendarFake.events.list({ calendarId: DEFAULT_VACATION_CALENDAR })).data.items)
            .toEqual(expect.arrayContaining(
                [expect.objectContaining({ summary: "tobias.potocek: OOO" })]
            ));
    });

    it('removes an outdated event from the vacation calendar', async () => {
        await calendarFake.events.insert({
            calendarId: DEFAULT_VACATION_CALENDAR,
            requestBody: new EventBuilder("tobias.potocek: OOO").on("Monday").toEvent()
        });

        setActorInput(DEFAULT_ACTOR_INPUT);

        await runActor();

        expect((await calendarFake.events.list({ calendarId: DEFAULT_VACATION_CALENDAR })).data.items)
            .toHaveLength(0);
    });

    it('syncs only events in working hours', async () => {
        await Promise.all([
            new EventBuilder("Dentist").on("Monday").from("07:00").to("08:00").toEvent(),           // ✘
            new EventBuilder("Kindergarten").on("Tuesday").from("11:00").to("13:00").toEvent(),     // ✔
            new EventBuilder("Gym").on("Thursday").from("16:00").to("17:00").toEvent(),             // ✘
            new EventBuilder("Friday off").on("Friday").toEvent(),                                  // ✔
            new EventBuilder("Weekend party").on("Saturday").from("10:00").to("11:00").toEvent(),   // ✘
            new EventBuilder("Vacation").from("2024-03-05").to("2024-03-10").toEvent()              // ✔
        ].map(event => calendarFake.events.insert({
            calendarId: DEFAULT_SOURCE_CALENDAR,
            requestBody: event
        })));

        setActorInput(DEFAULT_ACTOR_INPUT);

        await runActor();

        const events = (await calendarFake.events.list({ calendarId: DEFAULT_VACATION_CALENDAR })).data.items;
        expect(events).toHaveLength(3);
        expect(events)
            .toEqual(expect.arrayContaining([
                expect.objectContaining({ summary: "tobias.potocek: Kindergarten (lunch)" }),
                expect.objectContaining({ summary: "tobias.potocek: Friday off" }),
                expect.objectContaining({ summary: "tobias.potocek: Vacation" })]
            ));
    });

    // TODO: uses display overrides

    // TODO: ignores events not belonging to a person

    // TODO: syncs events from multiple calendars

    // TODO: converts to correct all-day events
});
