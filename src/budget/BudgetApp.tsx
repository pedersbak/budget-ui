import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Landmark, LayoutDashboard, PlusCircle, WalletCards } from 'lucide-react';
import { AppShell } from '../template/AppShell';
import { RouteGuard } from '../template/auth';
import { TemplateProvider, useTemplate } from '../template/context';
import { Alert, Badge, Button, Card, Input } from '../template/ui';
import type { AppBrand, NavItem } from '../template/types';
import { budgetAuthAdapter } from './auth';
import { BudgetDetailPage, BudgetFormPage, BudgetListPage } from './pages';
import { budgetMessages } from './messages';

const brand: AppBrand = {
  name: 'Balance',
  shortName: 'B',
  tagline: 'A clear plan for every month',
  logo: <span className="shell-brand__mark budget-brand-mark"><Landmark size={17} /></span>,
};

function AppRoutes() {
  const { session, t } = useTemplate();
  const navigation: NavItem[] = [
    { id: 'budgets', label: t('navBudgets'), to: '/budgets', icon: WalletCards, authenticated: true, mobile: true },
    { id: 'new-budget', label: t('navNewBudget'), to: '/budgets/new', icon: PlusCircle, authenticated: true, mobile: true },
  ];
  return <Routes>
    <Route element={<AppShell brand={brand} navigation={navigation} />}>
      <Route index element={session ? <Navigate to="/budgets" replace /> : <WelcomePage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route element={<RouteGuard />}>
        <Route path="budgets" element={<BudgetListPage />} />
        <Route path="budgets/new" element={<BudgetFormPage />} />
        <Route path="budgets/:budgetId" element={<BudgetDetailPage />} />
        <Route path="budgets/:budgetId/edit" element={<BudgetFormPage />} />
      </Route>
      <Route path="*" element={<StatusPage />} />
    </Route>
  </Routes>;
}

export default function BudgetApp() {
  return <TemplateProvider authAdapter={budgetAuthAdapter} messages={budgetMessages} defaultLocale="da" defaultTheme="obsidian">
    <BrowserRouter><AppRoutes /></BrowserRouter>
  </TemplateProvider>;
}

function WelcomePage() {
  const { t } = useTemplate();
  return <div className="page page--wide">
    <section className="budget-hero">
      <div>
        <Badge variant="success">12 months · one steady transfer</Badge>
        <h1>{t('welcomeTitle')}</h1>
        <p>{t('welcomeBody')}</p>
        <div className="ui-actions">
          <Link to="/login"><Button size="lg" icon={<LayoutDashboard size={18} />}>{t('welcomeAction')}</Button></Link>
          <Link to="/register"><Button size="lg" variant="outline">{t('welcomeSecondary')}</Button></Link>
        </div>
      </div>
      <Card className="budget-hero-card">
        <div className="budget-hero-card__top"><span>OCT 2026</span><Badge variant="success" pulse>Balanced</Badge></div>
        <div className="budget-hero-card__amount"><small>Monthly transfer</small><strong>12.000 kr.</strong></div>
        <div className="mini-bars" aria-hidden>{[48, 56, 42, 64, 59, 73, 52, 61, 68, 55, 76, 63].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>
        <div className="budget-hero-card__footer"><span>Reserve</span><strong>20.000 kr.</strong></div>
      </Card>
    </section>
  </div>;
}

function LoginPage() {
  const { session, login, t } = useTemplate();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await login({ email, password });
      navigate((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/budgets', { replace: true });
    } catch (reason) { setError(reason instanceof Error ? reason.message : t('loadError')); }
    finally { setBusy(false); }
  };
  if (session) return <Navigate to="/budgets" replace />;
  return <AuthPanel title={t('loginTitle')} description={t('loginBody')}>
    <form className="ui-form" onSubmit={submit}>
      <Input label={t('email')} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
      <Input label={t('password')} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
      {error && <Alert variant="danger">{error}</Alert>}
      <Button type="submit" loading={busy}>{busy ? t('signingIn') : t('signIn')}</Button>
    </form>
    <p className="ui-centered ui-muted">{t('noAccount')} <Link to="/register">{t('createAccount')}</Link></p>
  </AuthPanel>;
}

function RegisterPage() {
  const { session, register, t } = useTemplate();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.password !== form.confirm) { setError(t('passwordsMismatch')); return; }
    setBusy(true); setError('');
    try { await register(form); navigate('/budgets', { replace: true }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : t('loadError')); }
    finally { setBusy(false); }
  };
  if (session) return <Navigate to="/budgets" replace />;
  return <AuthPanel title={t('registerTitle')} description={t('registerBody')}>
    <form className="ui-form" onSubmit={submit}>
      <Input label={t('nickname')} value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} autoComplete="nickname" required />
      <Input label={t('email')} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required />
      <Input label={t('password')} type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" required />
      <Input label={t('confirmPassword')} type="password" minLength={8} value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} autoComplete="new-password" required />
      {error && <Alert variant="danger">{error}</Alert>}
      <Button type="submit" loading={busy}>{busy ? t('creatingAccount') : t('createAccount')}</Button>
    </form>
    <p className="ui-centered ui-muted">{t('haveAccount')} <Link to="/login">{t('signIn')}</Link></p>
  </AuthPanel>;
}

function AuthPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div className="page auth-page"><Card className="auth-card"><div className="auth-card__heading"><span className="shell-brand__mark"><Landmark size={17} /></span><h1>{title}</h1><p>{description}</p></div>{children}</Card></div>;
}

function StatusPage() {
  return <div className="page status-page"><strong>404</strong><h1>Page not found</h1><Link to="/"><Button variant="outline">Return home</Button></Link></div>;
}
