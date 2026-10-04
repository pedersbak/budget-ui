import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, CalendarRange, CircleDollarSign, Pencil, PiggyBank, Plus, RefreshCw, Trash2, WalletCards } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTemplate } from '../template/context';
import { Alert, Badge, Button, Card, DataTable, EmptyState, ErrorState, Input, LoadingState, PageHeader, Select, StatCard } from '../template/ui';
import { useBudgetApi } from './api';
import { budgetAnnualTotals, formatMoney, hasSavedBalance, MONTHS_DA, MONTHS_EN, projectBudget } from './helpers';
import { PaymentManager } from './payments';
import type { Budget, BudgetDraft, RebalanceResult } from './types';

const now = new Date();
const EMPTY_BUDGET: BudgetDraft = {
  name: '', currency: 'DKK', monthlyNetIncome: 0, monthlyExternalContribution: 0,
  quarterlyIncome: 0, quarterlyIncomeFirstMonth: 1, contingencyRate: 0.1,
  transferRoundingIncrement: 100, openingReserve: 0,
  forecastStartYear: now.getFullYear(), forecastStartMonth: now.getMonth() + 1,
};

export function BudgetListPage() {
  const api = useBudgetApi();
  const { locale, t } = useTemplate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [deleting, setDeleting] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError(undefined);
    try { setBudgets(await api.listBudgets()); }
    catch (reason) { setError(reason); }
    finally { setLoading(false); }
  }, [api]);
  useEffect(() => { void load(); }, [load]);
  const remove = async (budget: Budget) => {
    if (!globalThis.confirm(t('confirmDeleteBudget'))) return;
    setDeleting(budget.id);
    try { await api.deleteBudget(budget.id); setBudgets((current) => current.filter((item) => item.id !== budget.id)); }
    catch (reason) { setError(reason); }
    finally { setDeleting(''); }
  };
  return <div className="page page--wide">
    <PageHeader eyebrow={t('budgetsEyebrow')} title={t('budgetsTitle')} description={t('budgetsBody')} actions={<Link to="/budgets/new"><Button icon={<Plus size={16} />}>{t('newBudget')}</Button></Link>} />
    {loading ? <LoadingState /> : error ? <ErrorState title={t('loadError')} error={error} onRetry={load} /> : budgets.length === 0 ? <EmptyState title={t('noBudgets')} description={t('noBudgetsBody')} action={<Link to="/budgets/new"><Button>{t('createBudgetTitle')}</Button></Link>} /> :
      <div className="budget-card-grid">{budgets.map((budget) => {
        const totals = budgetAnnualTotals(budget);
        return <Card className="budget-card" key={budget.id}>
          <div className="budget-card__heading"><span className="budget-card__icon"><WalletCards /></span><Badge variant={hasSavedBalance(budget) ? 'success' : 'warning'}>{hasSavedBalance(budget) ? t('activeLabel') : t('needsRebalance')}</Badge></div>
          <h2>{budget.name}</h2>
          <p>{budget.recurringPayments.length} {t('recurringPayments').toLowerCase()}</p>
          <div className="budget-card__metrics">
            <div><small>{t('stableTransfer')}</small><strong>{hasSavedBalance(budget) ? formatMoney(budget.lastSuggestedMonthlyTransfer as number, budget.currency, locale === 'da' ? 'da-DK' : 'en-US') : '—'}</strong></div>
            <div><small>{t('annualBills')}</small><strong>{formatMoney(totals.budgetAccount, budget.currency, locale === 'da' ? 'da-DK' : 'en-US')}</strong></div>
          </div>
          <div className="budget-card__actions"><Link to={`/budgets/${budget.id}`}><Button size="sm">{t('openBudget')}</Button></Link><Button size="sm" variant="ghost" icon={<Trash2 size={15} />} loading={deleting === budget.id} onClick={() => void remove(budget)}>{deleting === budget.id ? t('deleting') : t('deleteBudget')}</Button></div>
        </Card>;
      })}</div>}
  </div>;
}

export function BudgetFormPage() {
  const { budgetId } = useParams();
  const api = useBudgetApi();
  const navigate = useNavigate();
  const { t } = useTemplate();
  const [draft, setDraft] = useState<BudgetDraft>(EMPTY_BUDGET);
  const [loading, setLoading] = useState(Boolean(budgetId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    if (!budgetId) return;
    let active = true;
    api.getBudget(budgetId).then((budget) => {
      if (!active) return;
      setDraft({
        name: budget.name, currency: budget.currency, monthlyNetIncome: budget.monthlyNetIncome,
        monthlyExternalContribution: budget.monthlyExternalContribution, quarterlyIncome: budget.quarterlyIncome,
        quarterlyIncomeFirstMonth: budget.quarterlyIncomeFirstMonth, contingencyRate: budget.contingencyRate,
        transferRoundingIncrement: budget.transferRoundingIncrement, openingReserve: budget.openingReserve,
        forecastStartYear: budget.forecastStartYear, forecastStartMonth: budget.forecastStartMonth,
      });
    }).catch(setError).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api, budgetId]);
  const setNumber = (field: keyof BudgetDraft, value: string) => setDraft((current) => ({ ...current, [field]: Number(value) }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(undefined);
    try {
      const budget = budgetId
        ? await api.updateBudget(budgetId, {
            name: draft.name, monthlyNetIncome: draft.monthlyNetIncome,
            monthlyExternalContribution: draft.monthlyExternalContribution,
            quarterlyIncome: draft.quarterlyIncome, quarterlyIncomeFirstMonth: draft.quarterlyIncomeFirstMonth,
            contingencyRate: draft.contingencyRate, transferRoundingIncrement: draft.transferRoundingIncrement,
            openingReserve: draft.openingReserve, forecastStartYear: draft.forecastStartYear,
            forecastStartMonth: draft.forecastStartMonth,
          })
        : await api.createBudget({ ...draft, currency: draft.currency.toUpperCase() });
      navigate(`/budgets/${budget.id}`);
    } catch (reason) { setError(reason); }
    finally { setSaving(false); }
  };
  if (loading) return <LoadingState />;
  return <div className="page page--narrow">
    <PageHeader eyebrow={t('budgetsEyebrow')} title={budgetId ? t('editBudgetTitle') : t('createBudgetTitle')} description={budgetId ? t('editBudgetBody') : t('createBudgetBody')} />
    <Card className="section-card"><form className="ui-form" onSubmit={submit}>
      <div className="ui-grid ui-grid--2">
        <Input label={t('name')} value={draft.name} maxLength={120} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
        <Input label={t('currency')} value={draft.currency} maxLength={3} disabled={Boolean(budgetId)} onChange={(event) => setDraft({ ...draft, currency: event.target.value.toUpperCase() })} required />
        <MoneyInput label={t('monthlyIncome')} value={draft.monthlyNetIncome} onChange={(value) => setNumber('monthlyNetIncome', value)} />
        <MoneyInput label={t('externalContribution')} value={draft.monthlyExternalContribution} onChange={(value) => setNumber('monthlyExternalContribution', value)} />
        <MoneyInput label={t('quarterlyIncome')} value={draft.quarterlyIncome} onChange={(value) => setNumber('quarterlyIncome', value)} />
        <MonthSelect label={t('quarterlyFirstMonth')} value={draft.quarterlyIncomeFirstMonth} onChange={(value) => setNumber('quarterlyIncomeFirstMonth', value)} />
        <Input label={t('contingency')} type="number" min="0" max="100" step="0.5" value={draft.contingencyRate * 100} onChange={(event) => setDraft({ ...draft, contingencyRate: Number(event.target.value) / 100 })} required />
        <MoneyInput label={t('rounding')} value={draft.transferRoundingIncrement} minimum={1} onChange={(value) => setNumber('transferRoundingIncrement', value)} />
        <MoneyInput label={t('openingReserve')} value={draft.openingReserve} onChange={(value) => setNumber('openingReserve', value)} />
        <Input label={t('forecastStart')} type="month" value={`${draft.forecastStartYear}-${String(draft.forecastStartMonth).padStart(2, '0')}`} min="2000-01" max="2200-12" onChange={(event) => { const [year, month] = event.target.value.split('-').map(Number); setDraft({ ...draft, forecastStartYear: year, forecastStartMonth: month }); }} required />
      </div>
      {Boolean(error) && <Alert variant="danger">{error instanceof Error ? error.message : t('loadError')}</Alert>}
      <div className="ui-actions"><Button type="submit" loading={saving}>{budgetId ? t('saveChanges') : t('create')}</Button><Button type="button" variant="ghost" onClick={() => navigate(budgetId ? `/budgets/${budgetId}` : '/budgets')}>{t('cancel')}</Button></div>
    </form></Card>
  </div>;
}

export function BudgetDetailPage() {
  const { budgetId = '' } = useParams();
  const api = useBudgetApi();
  const { locale, t } = useTemplate();
  const [budget, setBudget] = useState<Budget>();
  const [result, setResult] = useState<RebalanceResult>();
  const [loading, setLoading] = useState(true);
  const [rebalancing, setRebalancing] = useState(false);
  const [error, setError] = useState<unknown>();
  const load = useCallback(async () => {
    setLoading(true); setError(undefined);
    try { setBudget(await api.getBudget(budgetId)); }
    catch (reason) { setError(reason); }
    finally { setLoading(false); }
  }, [api, budgetId]);
  useEffect(() => { void load(); }, [load]);
  const rebalance = async () => {
    setRebalancing(true); setError(undefined);
    try {
      const next = await api.rebalance(budgetId); setResult(next);
      setBudget((current) => current ? { ...current, lastSuggestedMonthlyTransfer: next.suggestedMonthlyTransfer, lastRebalancedAt: new Date().toISOString() } : current);
    } catch (reason) { setError(reason); }
    finally { setRebalancing(false); }
  };
  const refreshAfterPayment = async () => { setResult(undefined); await load(); };
  const projection = useMemo(() => result ?? (budget ? projectBudget(budget) : null), [budget, result]);
  if (loading) return <LoadingState />;
  if (error && !budget) return <div className="page"><ErrorState title={t('loadError')} error={error} onRetry={load} /></div>;
  if (!budget) return <div className="page"><EmptyState title={t('notFound')} description={t('notFoundBody')} /></div>;
  const money = (value: number) => formatMoney(value, budget.currency, locale === 'da' ? 'da-DK' : 'en-US');
  const rows = projection?.months.map((month) => ({
    id: `${month.year}-${month.month}`, month: `${locale === 'da' ? MONTHS_DA[month.month - 1] : MONTHS_EN[month.month - 1]} ${month.year}`,
    bills: money(month.budgetAccountPayments), daily: money(month.dailyAccountPayments), income: money(month.income),
    transfer: money(month.suggestedTransfer), closing: money(month.closingBudgetAccountBalance), available: money(month.availableAfterPlannedAllocations),
  })) ?? [];
  return <div className="page page--wide">
    <Link className="back-link" to="/budgets"><ArrowLeft size={15} />{t('backToBudgets')}</Link>
    <PageHeader eyebrow={t('dashboard')} title={budget.name} description={`${budget.forecastStartYear} · ${budget.currency}`} actions={<><Link to={`/budgets/${budget.id}/edit`}><Button variant="outline" icon={<Pencil size={15} />}>{t('assumptions')}</Button></Link><Button icon={<RefreshCw size={15} />} loading={rebalancing} onClick={() => void rebalance()}>{rebalancing ? t('rebalancing') : t('rebalance')}</Button></>} />
    {Boolean(error) && <Alert variant="danger" onDismiss={() => setError(undefined)}>{error instanceof Error ? error.message : t('loadError')}</Alert>}
    {!hasSavedBalance(budget) && <Alert variant="warning" title={t('needsRebalance')}>{t('needsRebalanceBody')}</Alert>}
    <div className="ui-grid ui-grid--4">
      <StatCard label={t('stableTransfer')} value={projection ? money(projection.suggestedMonthlyTransfer) : '—'} icon={<CircleDollarSign />} />
      <StatCard label={t('annualBills')} value={projection ? money(projection.annualBudgetAccountPayments) : money(budgetAnnualTotals(budget).budgetAccount)} icon={<CalendarRange />} />
      <StatCard label={t('lowestBalance')} value={projection ? money(projection.minimumProjectedBudgetAccountBalance) : '—'} icon={<PiggyBank />} />
      <StatCard label={t('yearlyAvailable')} value={projection ? money(projection.annualAvailableAfterPlannedAllocations) : '—'} icon={<WalletCards />} />
    </div>
    <Card className="section-card">
      <div className="section-heading"><div><h2>{t('projection')}</h2><p className="ui-muted">{t('projectionBody')}</p></div></div>
      {rows.length ? <DataTable rows={rows} columns={[
        { key: 'month', label: t('month') }, { key: 'bills', label: t('bills') }, { key: 'daily', label: t('daily') },
        { key: 'income', label: t('income') }, { key: 'transfer', label: t('transfer') }, { key: 'closing', label: t('closing') }, { key: 'available', label: t('available') },
      ]} /> : <EmptyState title={t('needsRebalance')} description={t('needsRebalanceBody')} action={<Button onClick={() => void rebalance()}>{t('rebalance')}</Button>} />}
    </Card>
    <PaymentManager budget={budget} onChanged={refreshAfterPayment} />
  </div>;
}

function MoneyInput({ label, value, onChange, minimum = 0 }: { label: string; value: number; onChange: (value: string) => void; minimum?: number }) {
  return <Input label={label} type="number" min={minimum} step="0.01" value={value} onChange={(event) => onChange(event.target.value)} required />;
}

function MonthSelect({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  const { locale } = useTemplate(); const months = locale === 'da' ? MONTHS_DA : MONTHS_EN;
  return <Select label={label} value={value} onChange={(event) => onChange(event.target.value)}>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</Select>;
}
