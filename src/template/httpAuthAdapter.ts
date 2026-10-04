import type { AuthAdapter, AuthSession, Credentials, Registration } from './types';

export interface HttpAuthAdapterConfig {
  baseUrl: string;
  storageKey?: string;
  endpoints?: Partial<{ login: string; register: string; logout: string; refresh: string }>;
  mapSession?: (payload: unknown) => AuthSession;
  fetcher?: typeof fetch;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  const payload: unknown = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const record = typeof payload === 'object' && payload ? payload as Record<string, unknown> : null;
    throw new Error(typeof record?.message === 'string' ? record.message : typeof payload === 'string' && payload ? payload : `Request failed (${response.status})`);
  }
  return payload;
}

export function createHttpAuthAdapter(config: HttpAuthAdapterConfig): AuthAdapter {
  const base = config.baseUrl.replace(/\/$/, '');
  const storageKey = config.storageKey ?? 'iris-auth-session';
  const endpoints = { login: '/auth/login', register: '/auth/register', logout: '/auth/logout', refresh: '/auth/refresh', ...config.endpoints };
  const fetcher = config.fetcher ?? fetch;
  const map = config.mapSession ?? ((payload) => payload as AuthSession);
  const save = (session: AuthSession | null) => { if (session) localStorage.setItem(storageKey, JSON.stringify(session)); else localStorage.removeItem(storageKey); };
  const request = async (path: string, body: unknown, token?: string) => parseResponse(await fetcher(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) }));

  return {
    async restore() { try { const raw = localStorage.getItem(storageKey); return raw ? JSON.parse(raw) as AuthSession : null; } catch { return null; } },
    async login(credentials: Credentials) { const session = map(await request(endpoints.login, credentials)); save(session); return session; },
    async register(registration: Registration) { const payload = await request(endpoints.register, registration); if (!payload) return; const session = map(payload); save(session); return session; },
    async logout(session) { try { if (session) await request(endpoints.logout, { refreshToken: session.refreshToken }, session.accessToken); } finally { save(null); } },
    async refresh(session) { const refreshed = map(await request(endpoints.refresh, { refreshToken: session.refreshToken }, session.accessToken)); save(refreshed); return refreshed; },
  };
}
