import { convertToDayjsWithUTCOffset } from './convertToDayjsWithUTCOffset.js';

describe('convertToDayjsWithUTCOffset', () => {
    it('converts a date-time string to a Day.js object with the correct UTC +01:00 offset', () => {
        const date = '2024-02-05T10:00:00+01:00';
        const dayjs = convertToDayjsWithUTCOffset(date);
        expect(dayjs.format()).toBe(date);
    });

    it('converts a date-time string to a Day.js object with the correct UTC -08:00 offset', () => {
        const date = '2024-02-05T10:00:00-08:00';
        const dayjs = convertToDayjsWithUTCOffset(date);
        expect(dayjs.format()).toBe(date);
    });

    it('throws an error for an invalid date-time string', () => {
        const date = 'invalid';
        expect(() => convertToDayjsWithUTCOffset(date)).toThrow(`Invalid date-time string: ${date}`);
    });
});
