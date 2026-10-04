import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTemplate } from './context';
import { hasRole } from './types';
import type { AuthAdapter, AuthSession, Role } from './types';
import { LoadingState } from './ui';

export function RouteGuard({ minimumRole = 'user', children }: { minimumRole?: Role; children?: ReactNode }) {
  const { session, authReady } = useTemplate();
  const location = useLocation();
  if (!authReady) return <LoadingState label="Restoring session…" />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!hasRole(session.user.role, minimumRole)) return <Navigate to="/forbidden" replace />;
  return children ? <>{children}</> : <Outlet />;
}

const DEMO_KEY = 'iris-demo-session';
function readDemoSession(): AuthSession | null {
  try { const raw = localStorage.getItem(DEMO_KEY); return raw ? JSON.parse(raw) as AuthSession : null; } catch { return null; }
}
function saveDemoSession(session: AuthSession | null) {
  if (session) localStorage.setItem(DEMO_KEY, JSON.stringify(session)); else localStorage.removeItem(DEMO_KEY);
}
function makeDemoSession(email: string, displayName: string, role: Role): AuthSession {
  return { user: { id: `demo-${role}`, email, displayName, role, active: true }, accessToken: `demo-token-${role}` };
}

export const demoAuthAdapter: AuthAdapter = {
  async restore() { return readDemoSession(); },
  async login({ email, password }) {
    if (!email || !password) throw new Error('Enter both email and password.');
    const role: Role = email.toLowerCase().startsWith('super') ? 'superadmin' : email.toLowerCase().startsWith('admin') ? 'admin' : 'user';
    const session = makeDemoSession(email, email.split('@')[0] || 'Demo User', role);
    saveDemoSession(session); return session;
  },
  async register({ email, displayName, password }) {
    if (password.length < 8) throw new Error('Password must contain at least 8 characters.');
    const session = makeDemoSession(email, displayName, 'user'); saveDemoSession(session); return session;
  },
  async logout() { saveDemoSession(null); },
};

export function assumeDemoRole(role: Role) {
  const session = makeDemoSession(`${role}@example.test`, role === 'superadmin' ? 'Super Administrator' : role === 'admin' ? 'Administrator' : 'Demo User', role);
  saveDemoSession(session); return session;
}
