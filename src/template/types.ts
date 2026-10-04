import type { ElementType, ReactNode } from 'react';

export type Role = 'user' | 'admin' | 'superadmin';
export type ThemeId = 'electric' | 'professional' | 'blossom' | 'obsidian';
export type Locale = 'en' | 'da';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  active?: boolean;
}

export interface Credentials { email: string; password: string }
export interface Registration extends Credentials { displayName: string }
export interface AuthSession { user: User; accessToken: string; refreshToken?: string }

export interface AuthAdapter {
  restore(): Promise<AuthSession | null>;
  login(credentials: Credentials): Promise<AuthSession>;
  register(data: Registration): Promise<AuthSession | void>;
  logout(session: AuthSession | null): Promise<void>;
  refresh?(session: AuthSession): Promise<AuthSession>;
}

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon?: ElementType;
  minimumRole?: Role;
  authenticated?: boolean;
  mobile?: boolean;
}

export interface AppBrand {
  name: string;
  shortName?: string;
  tagline: string;
  logo?: ReactNode;
}

export const ROLE_WEIGHT: Record<Role, number> = { user: 0, admin: 1, superadmin: 2 };
export function hasRole(actual: Role | undefined, required: Role = 'user') {
  return actual !== undefined && ROLE_WEIGHT[actual] >= ROLE_WEIGHT[required];
}
