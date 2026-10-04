import { describe, expect, it } from 'vitest';
import { mapAuthResponse } from './auth';

function token(payload: Record<string, unknown>) {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'none' })}.${encode(payload)}.`;
}

describe('budget authentication mapping', () => {
  it('maps the API envelope and backend role claims to an Iris session', () => {
    const accessToken = token({ sub: 'user-1', email: 'jan@example.com', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Participant' });
    expect(mapAuthResponse({ success: true, data: { accessToken, refreshToken: 'refresh' } })).toEqual({
      accessToken, refreshToken: 'refresh',
      user: { id: 'user-1', email: 'jan@example.com', displayName: 'jan', role: 'user', active: true },
    });
  });

  it('rejects incomplete authentication responses', () => {
    expect(() => mapAuthResponse({ success: false, message: 'Nope' })).toThrow('Nope');
  });
});
