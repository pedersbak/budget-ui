import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {
  it('normalizes JavaScript and API-shaped errors', () => {
    expect(getErrorMessage(new Error('Offline'))).toBe('Offline');
    expect(getErrorMessage({ response: { data: { message: 'Not allowed' } } })).toBe('Not allowed');
  });
  it('uses a safe fallback for unknown values', () => expect(getErrorMessage(null, 'Fallback')).toBe('Fallback'));
});
