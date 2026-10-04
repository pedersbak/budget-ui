import { createHttpAuthAdapter } from '../template/httpAuthAdapter';
import type { AuthSession, Role } from '../template/types';
import type { ApiEnvelope } from './types';

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8080';
export const AUTH_STORAGE_KEY = 'budget-auth-session';

function decodePayload(token: string): Record<string, unknown> {
  const encoded = token.split('.')[1];
  if (!encoded) throw new Error('The server returned an invalid access token.');
  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(Array.from(atob(normalized), (character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
  return JSON.parse(json) as Record<string, unknown>;
}

function templateRole(role: unknown): Role {
  if (role === 'SuperAdmin') return 'superadmin';
  if (role === 'Admin') return 'admin';
  return 'user';
}

export function mapAuthResponse(payload: unknown): AuthSession {
  const envelope = payload as ApiEnvelope<{ accessToken: string; refreshToken: string }>;
  if (!envelope?.success || !envelope.data?.accessToken || !envelope.data.refreshToken) {
    throw new Error(envelope?.message || 'The authentication response was incomplete.');
  }
  const claims = decodePayload(envelope.data.accessToken);
  const email = String(claims.email ?? claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? '');
  const id = String(claims.sub ?? claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? '');
  if (!email || !id) throw new Error('The access token did not identify a user.');
  return {
    accessToken: envelope.data.accessToken,
    refreshToken: envelope.data.refreshToken,
    user: {
      id,
      email,
      displayName: email.split('@')[0] || email,
      role: templateRole(claims[ROLE_CLAIM] ?? claims.role),
      active: true,
    },
  };
}

export const budgetAuthAdapter = createHttpAuthAdapter({
  baseUrl: API_BASE_URL,
  storageKey: AUTH_STORAGE_KEY,
  mapSession: mapAuthResponse,
});
