import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronDown, Languages, LogIn, LogOut, Menu, Palette, UserRound, X } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Badge, Button } from './ui';
import { useTemplate } from './context';
import { hasRole } from './types';
import type { AppBrand, NavItem, ThemeId } from './types';

const THEME_OPTIONS: Array<{ id: ThemeId; label: string; swatch: string }> = [
  { id: 'electric', label: 'Electric', swatch: '#00d4ff' },
  { id: 'professional', label: 'Professional', swatch: '#2563eb' },
  { id: 'blossom', label: 'Blossom', swatch: '#db2777' },
  { id: 'obsidian', label: 'Obsidian', swatch: '#d8c3a5' },
];

function useOutsideClick(close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const handler = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) close(); }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, [close]);
  return ref;
}

export function PreferenceMenu() {
  const { locale, setLocale, theme, setTheme, t } = useTemplate();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick(() => setOpen(false));
  return <div className="shell-popover" ref={ref}><button className="shell-icon-button" onClick={() => setOpen((value) => !value)} aria-label={t('preferences')} aria-expanded={open}><Palette size={18} /></button>{open && <div className="shell-menu shell-preferences"><p className="ui-label">{t('theme')}</p>{THEME_OPTIONS.map((option) => <button key={option.id} onClick={() => setTheme(option.id)}><span className="shell-swatch" style={{ background: option.swatch }} />{option.label}{theme === option.id && <Check size={15} />}</button>)}<div className="shell-menu__divider" /><p className="ui-label">{t('language')}</p><button onClick={() => setLocale('en')}><Languages size={15} />English{locale === 'en' && <Check size={15} />}</button><button onClick={() => setLocale('da')}><Languages size={15} />Dansk{locale === 'da' && <Check size={15} />}</button></div>}</div>;
}

export interface AppShellProps {
  brand: AppBrand;
  navigation: NavItem[];
  footer?: ReactNode;
  announcements?: ReactNode;
  children?: ReactNode;
}

export function AppShell({ brand, navigation, footer, announcements, children }: AppShellProps) {
  const { session, logout, t } = useTemplate();
  const navigate = useNavigate();
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userRef = useOutsideClick(() => setUserOpen(false));
  const visible = navigation.filter((item) => (!item.authenticated || session) && (!item.minimumRole || hasRole(session?.user.role, item.minimumRole)));
  const mobile = visible.filter((item) => item.mobile !== false).slice(0, 5);
  const doLogout = async () => { await logout(); navigate('/login'); };

  return <div className="shell">
    <header className="shell-header"><div className="shell-header__inner"><Link className="shell-brand" to="/">{brand.logo ?? <span className="shell-brand__mark">I</span>}<span>{brand.name}</span></Link><nav className="shell-nav" aria-label="Primary">{visible.map((item) => <NavEntry item={item} key={item.id} />)}</nav><div className="shell-header__actions"><PreferenceMenu />{session ? <div className="shell-popover" ref={userRef}><button className="shell-user" onClick={() => setUserOpen((value) => !value)}><UserRound size={17} /><span>{session.user.displayName}</span>{session.user.role !== 'user' && <Badge variant={session.user.role}>{session.user.role}</Badge>}<ChevronDown size={14} /></button>{userOpen && <div className="shell-menu shell-user-menu"><div className="shell-menu__profile"><strong>{session.user.displayName}</strong><span>{session.user.email}</span></div><button onClick={doLogout}><LogOut size={16} />{t('signOut')}</button></div>}</div> : <Button size="sm" variant="outline" icon={<LogIn size={16} />} onClick={() => navigate('/login')}>{t('signIn')}</Button>}<button className="shell-icon-button shell-menu-toggle" onClick={() => setMobileOpen((value) => !value)} aria-label="Menu">{mobileOpen ? <X size={19} /> : <Menu size={19} />}</button></div></div>{mobileOpen && <nav className="shell-drawer">{visible.map((item) => <NavEntry item={item} key={item.id} onClick={() => setMobileOpen(false)} />)}</nav>}</header>
    {announcements}
    <main className="shell-main">{children ?? <Outlet />}</main>
    <footer className="shell-footer">{footer ?? <><strong>{brand.name}</strong><span>{brand.tagline} · © {new Date().getFullYear()}</span></>}</footer>
    <nav className="shell-bottom-nav" aria-label="Mobile navigation">{mobile.map((item) => <NavEntry item={item} key={item.id} compact />)}</nav>
  </div>;
}

function NavEntry({ item, onClick, compact }: { item: NavItem; onClick?: () => void; compact?: boolean }) {
  const Icon = item.icon;
  return <NavLink to={item.to} end={item.to === '/'} onClick={onClick} className={({ isActive }) => `shell-nav-link${isActive ? ' active' : ''}${compact ? ' compact' : ''}`}>{Icon && <Icon size={compact ? 20 : 16} aria-hidden />}{!compact || <span>{item.label}</span>}{!compact && item.label}</NavLink>;
}
