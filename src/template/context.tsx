import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthAdapter, AuthSession, Credentials, Locale, Registration, ThemeId } from './types';

type Messages = Record<string, string>;
interface TemplateContextValue {
  session: AuthSession | null;
  authReady: boolean;
  locale: Locale;
  theme: ThemeId;
  t: (key: string, values?: Record<string, string | number>) => string;
  login: (credentials: Credentials) => Promise<void>;
  register: (registration: Registration) => Promise<void>;
  logout: () => Promise<void>;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemeId) => void;
  assumeRole?: (role: 'user' | 'admin' | 'superadmin') => void;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);
const THEMES: ThemeId[] = ['electric', 'professional', 'blossom', 'obsidian'];

function readPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  } catch { return fallback; }
}

export interface TemplateProviderProps {
  children: ReactNode;
  authAdapter: AuthAdapter;
  messages: Record<Locale, Messages>;
  defaultLocale?: Locale;
  defaultTheme?: ThemeId;
  onAssumeRole?: (role: 'user' | 'admin' | 'superadmin') => AuthSession;
}

export function TemplateProvider({ children, authAdapter, messages, defaultLocale = 'en', defaultTheme = 'obsidian', onAssumeRole }: TemplateProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [locale, setLocaleState] = useState<Locale>(() => readPreference('iris-locale', ['en', 'da'], defaultLocale));
  const [theme, setThemeState] = useState<ThemeId>(() => readPreference('iris-theme', THEMES, defaultTheme));

  useEffect(() => {
    let active = true;
    authAdapter.restore().then((value) => { if (active) setSession(value); }).finally(() => { if (active) setAuthReady(true); });
    return () => { active = false; };
  }, [authAdapter]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === 'professional' || theme === 'blossom' ? 'light' : 'dark';
  }, [theme]);

  const login = useCallback(async (credentials: Credentials) => setSession(await authAdapter.login(credentials)), [authAdapter]);
  const register = useCallback(async (registration: Registration) => {
    const result = await authAdapter.register(registration);
    if (result) setSession(result);
  }, [authAdapter]);
  const logout = useCallback(async () => { await authAdapter.logout(session); setSession(null); }, [authAdapter, session]);
  const setLocale = useCallback((next: Locale) => { localStorage.setItem('iris-locale', next); setLocaleState(next); }, []);
  const setTheme = useCallback((next: ThemeId) => { localStorage.setItem('iris-theme', next); setThemeState(next); }, []);
  const t = useCallback((key: string, values: Record<string, string | number> = {}) => {
    let result = messages[locale][key] ?? messages.en[key] ?? key;
    Object.entries(values).forEach(([name, value]) => { result = result.split(`{${name}}`).join(String(value)); });
    return result;
  }, [locale, messages]);
  const assumeRole = onAssumeRole ? (role: 'user' | 'admin' | 'superadmin') => setSession(onAssumeRole(role)) : undefined;

  const value = useMemo(() => ({ session, authReady, locale, theme, t, login, register, logout, setLocale, setTheme, assumeRole }), [session, authReady, locale, theme, t, login, register, logout, setLocale, setTheme, assumeRole]);
  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
}

export function useTemplate() {
  const value = useContext(TemplateContext);
  if (!value) throw new Error('useTemplate must be used inside TemplateProvider');
  return value;
}
