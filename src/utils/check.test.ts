import { checkStringNotEmpty } from './check.js';

describe('checkStringNotEmpty', () => {
    it('throws an error if the string is empty', () => {
        expect(() => checkStringNotEmpty('', 'test')).toThrow('test must be a non-empty string');
    });
    it('throws an error if the string is undefined', () => {
        expect(() => checkStringNotEmpty(undefined, 'test')).toThrow('test must be a non-empty string');
    });
    it('throws an error if the string is null', () => {
        expect(() => checkStringNotEmpty(null, 'test')).toThrow('test must be a non-empty string');
    });
    it('returns the string if it is not empty', () => {
        expect(checkStringNotEmpty('test', 'test')).toBe('test');
    });
});
