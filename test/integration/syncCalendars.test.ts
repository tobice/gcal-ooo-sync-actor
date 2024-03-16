import { runActor } from '../../src/runActor.js';
import process from 'process';
import GoogleCalendarFake, { INACCESSIBLE_CALENDAR_ID } from '../utils/GoogleCalendarFake.js';
import { Actor } from 'apify';
import { ActorInput } from '../../src/utils/getActorInput.js';
import { EventBuilder } from '../utils/EventBuilder.js';
import { calendar_v3 } from 'googleapis';
import Schema$Event = calendar_v3.Schema$Event;

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
const DEFAULT_VACATION_CALENDAR = 'apify-vacations@apify.com';
const DEFAULT_SOURCE_CALENDAR = 'john.doe@apify.com';
const DEFAULT_ACTOR_INPUT = {
    displayNameOverrides: [],
    sourceCalendarIds: [
        DEFAULT_SOURCE_CALENDAR
    ],
    targetCalendarId: DEFAULT_VACATION_CALENDAR,
    daysToSync: 60,
    workingHoursStart: '09:00',
    workingHoursEnd: '16:00'
};

function setActorInput(input: ActorInput) {
    jest.spyOn(Actor, 'getInput').mockImplementation(async () => input);
}

describe('syncCalendars', () => {

    beforeAll(() => {
        // Set up env variables
        jest.resetModules(); // Clears cache for the variables to take effect.
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
            requestBody: new EventBuilder('OOO').on('Monday').toEvent()
        });

        setActorInput(DEFAULT_ACTOR_INPUT);

        await runActor();

        expect((await calendarFake.events.list({ calendarId: DEFAULT_VACATION_CALENDAR })).data.items)
            .toEqual(expect.arrayContaining(
                [expect.objectContaining({ summary: 'john.doe: OOO' })]
            ));
    });

    it('removes an outdated event from the vacation calendar', async () => {
        await calendarFake.events.insert({
            calendarId: DEFAULT_VACATION_CALENDAR,
            requestBody: new EventBuilder('john.doe: OOO').on('Monday').toEvent()
        });

        setActorInput(DEFAULT_ACTOR_INPUT);

        await runActor();

        expect((await calendarFake.events.list({ calendarId: DEFAULT_VACATION_CALENDAR })).data.items)
            .toHaveLength(0);
    });

    it('syncs only events in working hours', async () => {
        const sourceTestEvents = [
            new EventBuilder('Dentist').on('Monday').from('07:00').to('08:00').toEvent(),           // ✘
            new EventBuilder('Kindergarten').on('Tuesday').from('11:00').to('13:00').toEvent(),     // ✔
            new EventBuilder('Gym').on('Thursday').from('16:00').to('17:00').toEvent(),             // ✘
            new EventBuilder('Friday off').on('Friday').toEvent(),                                  // ✔
            new EventBuilder('Weekend party').on('Saturday').from('10:00').to('11:00').toEvent(),   // ✘
            new EventBuilder('Vacation').from('2024-03-05').to('2024-03-10').toEvent()              // ✔
        ]

        for (const event of sourceTestEvents) {
            await calendarFake.events.insert({
                calendarId: DEFAULT_SOURCE_CALENDAR,
                requestBody: event
            });
        }

        setActorInput(DEFAULT_ACTOR_INPUT);

        await runActor();

        const events = (await calendarFake.events.list({ calendarId: DEFAULT_VACATION_CALENDAR })).data.items;
        expect(events).toHaveLength(3);
        expect(events)
            .toEqual(expect.arrayContaining([
                expect.objectContaining({ summary: 'john.doe: Kindergarten (lunch)' }),
                expect.objectContaining({ summary: 'john.doe: Friday off' }),
                expect.objectContaining({ summary: 'john.doe: Vacation' })]
            ));
    });

    it('applies display overrides', async () => {
        await calendarFake.events.insert({
            calendarId: 'john.doe@apify.com',
            requestBody: new EventBuilder('OOO').on('Monday').toEvent()
        });

        setActorInput({
            ...DEFAULT_ACTOR_INPUT,
            sourceCalendarIds: [
                'john.doe@apify.com'
            ],
            displayNameOverrides: [{ key: 'john.doe@apify.com', value: 'Johnny' }]
        });

        await runActor();

        expect((await calendarFake.events.list({ calendarId: DEFAULT_VACATION_CALENDAR })).data.items)
            .toEqual(expect.arrayContaining(
                [expect.objectContaining({ summary: 'Johnny: OOO' })]
            ));
    });

    it('ignores vacation events belonging to somebody else', async () => {
        await calendarFake.events.insert({
            calendarId: DEFAULT_VACATION_CALENDAR,
            requestBody: new EventBuilder('Jane: OOO').on('Monday').toEvent(),
        });
        await calendarFake.events.insert({
            calendarId: DEFAULT_VACATION_CALENDAR,
            requestBody: new EventBuilder('Adam: Dentist').on('Monday').from('09:00').to('10:00').toEvent(),
        });

        // Source calendar is intentionally empty

        setActorInput(DEFAULT_ACTOR_INPUT);

        await runActor();

        expect((await calendarFake.events.list({ calendarId: DEFAULT_VACATION_CALENDAR })).data.items)
            .toEqual(expect.arrayContaining([
                expect.objectContaining({ summary: 'Jane: OOO' }),
                expect.objectContaining({ summary: 'Adam: Dentist' })
            ]));
    });

    it('syncs events from multiple calendars', async () => {
        await calendarFake.events.insert({
            calendarId: 'jane.honda@apify.com',
            requestBody: new EventBuilder('OOO').on('Monday').toEvent(),
        });
        await calendarFake.events.insert({
            calendarId: 'adam.good@apify.com',
            requestBody: new EventBuilder('Dentist').on('Monday').from('09:00').to('10:00').toEvent(),
        });

        setActorInput({
            ...DEFAULT_ACTOR_INPUT,
            sourceCalendarIds: ['jane.honda@apify.com', 'adam.good@apify.com']
        });

        await runActor();

        expect((await calendarFake.events.list({ calendarId: DEFAULT_VACATION_CALENDAR })).data.items)
            .toEqual(expect.arrayContaining([
                expect.objectContaining({ summary: 'jane.honda: OOO' }),
                expect.objectContaining({ summary: 'adam.good: Dentist (morning)' })
            ]));
    });

    it('converts source events to all-day events', async () => {
        const sourceTestEvents = [
            new EventBuilder('Kindergarten').on('2024-03-05').from('11:00').to('13:00').toEvent(),
            new EventBuilder('Flight to Tokyo').from('2024-03-06', '15:00').to('2024-03-07', '10:00').toEvent(),
            new EventBuilder('Friday off').from('2024-03-08', '00:00').to('2024-03-09', '00:00').toEvent(),
        ]

        for (const event of sourceTestEvents) {
            await calendarFake.events.insert({
                calendarId: DEFAULT_SOURCE_CALENDAR,
                requestBody: event
            });
        }

        setActorInput(DEFAULT_ACTOR_INPUT);

        await runActor();

        // Note that the end dates are always exclusive
        expect((await calendarFake.events.list({ calendarId: DEFAULT_VACATION_CALENDAR })).data.items)
            .toEqual(expect.arrayContaining([
                expect.objectContaining({
                    summary: 'john.doe: Kindergarten (lunch)',
                    start: { date: '2024-03-05' },
                    end: { date: '2024-03-06' }
                }),
                expect.objectContaining({
                    summary: 'john.doe: Flight to Tokyo',
                    start: { date: '2024-03-06' },
                    end: { date: '2024-03-08' }
                }),
                expect.objectContaining({
                    summary: 'john.doe: Friday off',
                    start: { date: '2024-03-08' },
                    end: { date: '2024-03-09' }
                }),
            ]));
    });

    it('syncs all events even when pagination is needed', async () => {
        // Set a small page size to force pagination
        calendarFake = new GoogleCalendarFake(/* pageSize = */ 2);

        // Insert enough events so that they won't fit into a single page
        for (let i = 0; i < 5; i++) {
            await calendarFake.events.insert({
                calendarId: DEFAULT_SOURCE_CALENDAR,
                requestBody: new EventBuilder(`Event ${i}`).on('Monday').toEvent()
            });
        }

        setActorInput(DEFAULT_ACTOR_INPUT);

        await runActor();

        // As we're using the low level fake API, the small page size applies here as well, and we need to fetch the
        // events by pages. We could simplify our work by somehow looking directly inside, but this is a more realistic.
        let events: Schema$Event[] = [];
        let pageToken = null;

        do {
            // @ts-ignore as pageToken type is broken
            const response = await calendarFake.events.list({ calendarId: DEFAULT_VACATION_CALENDAR, pageToken });
            events = events.concat(response.data.items);
            pageToken = response.data.nextPageToken;
        } while (pageToken);

        expect(events).toHaveLength(5);
    });

    it('fails if provided invalid Actor input', async () => {
        setActorInput({
            ...DEFAULT_ACTOR_INPUT,
            sourceCalendarIds: [''],
        });

        await expect(runActor())
            .rejects
            .toEqual(new Error('Invalid actor input: Source calendar ID must be a valid email address'));
    });

    it('fails if Google API returns an error', async () => {
        // Simulate a calendar that cannot be accessed
        setActorInput({
            ...DEFAULT_ACTOR_INPUT,
            sourceCalendarIds: [INACCESSIBLE_CALENDAR_ID],
        });

        await expect(runActor())
            .rejects
            .toEqual(new Error('Failed to list events'));
    });
});
