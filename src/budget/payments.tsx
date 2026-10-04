import { useMemo, useState } from 'react';
import type { FormEvent, SyntheticEvent } from 'react';
import { ArrowLeftRight, ChevronRight, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTemplate } from '../template/context';
import { Alert, Badge, Button, Card, EmptyState, Input, Modal, Select, Textarea } from '../template/ui';
import { useBudgetApi } from './api';
import { annualPaymentTotal, formatMoney, groupPayments, MONTHS_DA, MONTHS_EN, paymentMonths } from './helpers';
import type { Budget, PaymentDraft, PaymentFrequency, RecurringPayment } from './types';

const EMPTY_PAYMENT: PaymentDraft = {
  name: '', category: '', account: 'BudgetAccount', amount: 0, frequency: 'Monthly',
  firstPaymentMonth: 1, selectedMonths: [], isActive: true, notes: '',
};

export function PaymentManager({ budget, onChanged }: { budget: Budget; onChanged: () => Promise<void> }) {
  const api = useBudgetApi();
  const { locale, t } = useTemplate();
  const [editing, setEditing] = useState<RecurringPayment | 'new' | null>(null);
  const [deleting, setDeleting] = useState('');
  const [moving, setMoving] = useState('');
  const [error, setError] = useState<unknown>();
  const groups = useMemo(() => groupPayments(budget.recurringPayments), [budget.recurringPayments]);
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set(Object.keys(groups).slice(0, 3)));
  const money = (value: number) => formatMoney(value, budget.currency, locale === 'da' ? 'da-DK' : 'en-US');
  const keepCategoryOpen = (category: string) => setOpenCategories((current) => new Set(current).add(category));
  const rememberGroupState = (category: string, event: SyntheticEvent<HTMLDetailsElement>) => {
    const isOpen = event.currentTarget.open;
    setOpenCategories((current) => {
      if (current.has(category) === isOpen) return current;
      const next = new Set(current);
      if (isOpen) next.add(category); else next.delete(category);
      return next;
    });
  };
  const returnToPayment = (paymentId: string) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const row = document.getElementById(`payment-${paymentId}`);
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row?.focus({ preventScroll: true });
    }));
  };
  const paymentChanged = async (payment: RecurringPayment) => {
    keepCategoryOpen(payment.category);
    setEditing(null);
    await onChanged();
    returnToPayment(payment.id);
  };
  const movePayment = async (payment: RecurringPayment) => {
    const account = payment.account === 'BudgetAccount' ? 'DailyAccount' : 'BudgetAccount';
    setMoving(payment.id); setError(undefined); keepCategoryOpen(payment.category);
    try {
      const updated = await api.updatePayment(budget.id, payment.id, { ...toDraft(payment), account });
      await onChanged();
      returnToPayment(updated.id);
    } catch (reason) { setError(reason); }
    finally { setMoving(''); }
  };
  const remove = async (payment: RecurringPayment) => {
    if (!globalThis.confirm(t('confirmDeletePayment'))) return;
    setDeleting(payment.id); setError(undefined);
    try { await api.deletePayment(budget.id, payment.id); await onChanged(); }
    catch (reason) { setError(reason); }
    finally { setDeleting(''); }
  };
  return <Card className="section-card payment-section">
    <div className="section-heading"><div><h2>{t('recurringPayments')}</h2><p className="ui-muted">{t('paymentsBody')}</p></div><Button size="sm" icon={<Plus size={15} />} onClick={() => setEditing('new')}>{t('addPayment')}</Button></div>
    {Boolean(error) && <Alert variant="danger" onDismiss={() => setError(undefined)}>{error instanceof Error ? error.message : t('loadError')}</Alert>}
    {Object.keys(groups).length === 0 ? <EmptyState title={t('noPayments')} description={t('noPaymentsBody')} action={<Button onClick={() => setEditing('new')}>{t('addPayment')}</Button>} /> :
      <div className="payment-groups">{Object.entries(groups).map(([category, payments]) => {
        const total = payments.reduce((sum, payment) => sum + annualPaymentTotal(payment), 0);
        return <details className="payment-group" key={category} open={openCategories.has(category)} onToggle={(event) => rememberGroupState(category, event)}>
          <summary><ChevronRight size={17} /><span><strong>{category}</strong><small>{payments.length} · {money(total)} {t('annualTotal')}</small></span><strong>{money(total / 12)} <small>{t('monthlyAverage')}</small></strong></summary>
          <div className="payment-list">{payments.map((payment) => {
            const targetAccount = payment.account === 'BudgetAccount' ? t('dailyAccount') : t('budgetAccount');
            return <article id={`payment-${payment.id}`} tabIndex={-1} className={`payment-row${payment.isActive ? '' : ' payment-row--inactive'}`} key={payment.id}>
            <div className="payment-row__main"><strong>{payment.name}</strong><span>{frequencyLabel(payment.frequency, t)} · {monthsLabel(payment, locale)}</span>{payment.notes && <small>{payment.notes}</small>}</div>
            <div className="payment-row__account"><button className={`ui-badge payment-account-toggle ui-badge--${payment.account === 'BudgetAccount' ? 'info' : 'neutral'}`} disabled={moving === payment.id} title={t('movePaymentAccount', { name: payment.name, account: targetAccount })} aria-label={t('movePaymentAccount', { name: payment.name, account: targetAccount })} onClick={() => void movePayment(payment)}>{moving === payment.id ? <Loader2 className="ui-spin" size={12} /> : <ArrowLeftRight size={12} />}{payment.account === 'BudgetAccount' ? t('budgetAccount') : t('dailyAccount')}</button><Badge variant={payment.isActive ? 'success' : 'warning'}>{payment.isActive ? t('activeLabel') : t('inactiveLabel')}</Badge></div>
            <div className="payment-row__amount"><strong>{money(payment.amount)}</strong><small>{money(annualPaymentTotal(payment))} / {t('annualTotal')}</small></div>
            <div className="payment-row__actions"><Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={() => setEditing(payment)}>{t('edit')}</Button><Button size="sm" variant="ghost" icon={<Trash2 size={14} />} loading={deleting === payment.id} onClick={() => void remove(payment)}>{t('deletePayment')}</Button></div>
          </article>; })}</div>
        </details>;
      })}</div>}
    <PaymentModal key={`${budget.id}-${editing === 'new' ? 'new' : editing?.id ?? 'closed'}`} budget={budget} payment={editing === 'new' ? undefined : editing ?? undefined} open={editing !== null} onClose={() => setEditing(null)} onSaved={paymentChanged} />
  </Card>;
}

function PaymentModal({ budget, payment, open, onClose, onSaved }: { budget: Budget; payment?: RecurringPayment; open: boolean; onClose: () => void; onSaved: (payment: RecurringPayment) => Promise<void> }) {
  const api = useBudgetApi();
  const { locale, t } = useTemplate();
  const months = locale === 'da' ? MONTHS_DA : MONTHS_EN;
  const [draft, setDraft] = useState<PaymentDraft>(() => payment ? toDraft(payment) : EMPTY_PAYMENT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>();
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(undefined);
    try {
      const saved = payment
        ? await api.updatePayment(budget.id, payment.id, draft)
        : await api.createPayment(budget.id, draft);
      await onSaved(saved);
    } catch (reason) { setError(reason); }
    finally { setSaving(false); }
  };
  const toggleMonth = (month: number) => setDraft((current) => ({ ...current, selectedMonths: current.selectedMonths.includes(month) ? current.selectedMonths.filter((item) => item !== month) : [...current.selectedMonths, month].sort((a, b) => a - b) }));
  return <Modal open={open} onClose={onClose} title={payment ? t('editPayment') : t('addPayment')} footer={<div className="ui-actions"><Button variant="ghost" onClick={onClose}>{t('cancel')}</Button><Button type="submit" form="payment-form" loading={saving}>{t('savePayment')}</Button></div>}>
    <form id="payment-form" className="ui-form" onSubmit={submit}>
      <div className="ui-grid ui-grid--2">
        <Input label={t('name')} value={draft.name} maxLength={160} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
        <Input label={t('category')} value={draft.category} list="payment-categories" maxLength={100} onChange={(event) => setDraft({ ...draft, category: event.target.value })} required />
        <datalist id="payment-categories">{[...new Set(budget.recurringPayments.map((item) => item.category))].map((category) => <option key={category} value={category} />)}</datalist>
        <Select label={t('account')} value={draft.account} onChange={(event) => setDraft({ ...draft, account: event.target.value as PaymentDraft['account'] })}><option value="BudgetAccount">{t('budgetAccount')}</option><option value="DailyAccount">{t('dailyAccount')}</option></Select>
        <Input label={t('amount')} type="number" min="0.01" step="0.01" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} required />
        <Select label={t('frequency')} value={draft.frequency} onChange={(event) => setDraft({ ...draft, frequency: event.target.value as PaymentFrequency })}><option value="Monthly">{t('monthly')}</option><option value="Quarterly">{t('quarterly')}</option><option value="SemiAnnual">{t('semiAnnual')}</option><option value="Annual">{t('annual')}</option><option value="SelectedMonths">{t('selected')}</option></Select>
        {draft.frequency !== 'SelectedMonths' && <Select label={t('firstMonth')} value={draft.firstPaymentMonth} onChange={(event) => setDraft({ ...draft, firstPaymentMonth: Number(event.target.value) })}>{months.map((month, index) => <option value={index + 1} key={month}>{month}</option>)}</Select>}
      </div>
      {draft.frequency === 'SelectedMonths' && <fieldset className="month-picker"><legend>{t('selectedMonths')}</legend>{months.map((month, index) => <label key={month}><input type="checkbox" checked={draft.selectedMonths.includes(index + 1)} onChange={() => toggleMonth(index + 1)} /><span>{month}</span></label>)}</fieldset>}
      <Textarea label={t('notes')} value={draft.notes} maxLength={1000} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
      <label className="toggle-field"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /><span><strong>{t('active')}</strong><small>{draft.isActive ? t('activeLabel') : t('inactiveLabel')}</small></span></label>
      {Boolean(error) && <Alert variant="danger">{error instanceof Error ? error.message : t('loadError')}</Alert>}
    </form>
  </Modal>;
}

function toDraft(payment: RecurringPayment): PaymentDraft {
  return { name: payment.name, category: payment.category, account: payment.account, amount: payment.amount, frequency: payment.frequency, firstPaymentMonth: payment.firstPaymentMonth, selectedMonths: [...payment.selectedMonths], isActive: payment.isActive, notes: payment.notes ?? '' };
}

function frequencyLabel(frequency: PaymentFrequency, t: (key: string) => string) {
  const keys: Record<PaymentFrequency, string> = { Monthly: 'monthly', Quarterly: 'quarterly', SemiAnnual: 'semiAnnual', Annual: 'annual', SelectedMonths: 'selected' };
  return t(keys[frequency]);
}

function monthsLabel(payment: RecurringPayment, locale: 'en' | 'da') {
  const months = locale === 'da' ? MONTHS_DA : MONTHS_EN;
  if (payment.frequency === 'Monthly') return months.join(' · ');
  return paymentMonths(payment).map((month) => months[month - 1]).join(' · ');
}
