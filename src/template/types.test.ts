import { describe, expect, it } from 'vitest';
import { hasRole } from './types';

describe('hasRole', () => {
  it('allows inherited access down the role hierarchy', () => {
    expect(hasRole('superadmin', 'admin')).toBe(true);
    expect(hasRole('admin', 'user')).toBe(true);
  });

  it('rejects missing or insufficient roles', () => {
    expect(hasRole('user', 'admin')).toBe(false);
    expect(hasRole(undefined, 'user')).toBe(false);
  });
});
