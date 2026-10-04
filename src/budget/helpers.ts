import type { Budget, PaymentFrequency, RecurringPayment } from './types';

export const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_DA = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

export function formatMoney(value: number, currency = 'DKK', locale = 'da-DK') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function paymentMonths(payment: Pick<RecurringPayment, 'frequency' | 'firstPaymentMonth' | 'selectedMonths'>): number[] {
  const frequency = payment.frequency;
  if (frequency === 'SelectedMonths') return [...payment.selectedMonths].sort((a, b) => a - b);
  const interval: Record<Exclude<PaymentFrequency, 'SelectedMonths'>, number> = {
    Monthly: 1,
    Quarterly: 3,
    SemiAnnual: 6,
    Annual: 12,
  };
  return Array.from({ length: 12 }, (_, index) => index + 1)
    .filter((month) => (month - payment.firstPaymentMonth + 12) % interval[frequency] === 0);
}

export function annualPaymentTotal(payment: RecurringPayment) {
  return payment.isActive ? payment.amount * paymentMonths(payment).length : 0;
}

export function budgetAnnualTotals(budget: Budget) {
  const active = budget.recurringPayments.filter((payment) => payment.isActive);
  const budgetAccount = active.filter((payment) => payment.account === 'BudgetAccount').reduce((sum, payment) => sum + annualPaymentTotal(payment), 0);
  const dailyAccount = active.filter((payment) => payment.account === 'DailyAccount').reduce((sum, payment) => sum + annualPaymentTotal(payment), 0);
  return { budgetAccount, dailyAccount, total: budgetAccount + dailyAccount };
}

export function groupPayments(payments: RecurringPayment[]) {
  return [...payments].sort((a, b) => a.name.localeCompare(b.name)).reduce<Record<string, RecurringPayment[]>>((groups, payment) => {
    (groups[payment.category] ??= []).push(payment);
    return groups;
  }, {});
}

export function hasSavedBalance(budget: Budget) {
  return budget.lastSuggestedMonthlyTransfer !== null && budget.lastSuggestedMonthlyTransfer !== undefined;
}

export function projectBudget(budget: Budget) {
  if (!hasSavedBalance(budget)) return null;
  const transfer = budget.lastSuggestedMonthlyTransfer as number;
  const active = budget.recurringPayments.filter((payment) => payment.isActive);
  let balance = budget.openingReserve;
  let minimumBalance = Number.POSITIVE_INFINITY;
  let annualAvailable = 0;
  const start = new Date(budget.forecastStartYear, budget.forecastStartMonth - 1, 1);
  const months = Array.from({ length: 12 }, (_, offset) => {
    const date = new Date(start.getFullYear(), start.getMonth() + offset, 1);
    const month = date.getMonth() + 1;
    const due = active.filter((payment) => paymentMonths(payment).includes(month));
    const budgetAccountPayments = due.filter((payment) => payment.account === 'BudgetAccount').reduce((sum, payment) => sum + payment.amount, 0);
    const dailyAccountPayments = due.filter((payment) => payment.account === 'DailyAccount').reduce((sum, payment) => sum + payment.amount, 0);
    const quarterlyIncome = (month - budget.quarterlyIncomeFirstMonth + 12) % 3 === 0 ? budget.quarterlyIncome : 0;
    const income = budget.monthlyNetIncome + quarterlyIncome;
    balance += transfer + budget.monthlyExternalContribution - budgetAccountPayments;
    minimumBalance = Math.min(minimumBalance, balance);
    const availableAfterPlannedAllocations = income - transfer - dailyAccountPayments;
    annualAvailable += availableAfterPlannedAllocations;
    return {
      year: date.getFullYear(), month, budgetAccountPayments, dailyAccountPayments, income,
      suggestedTransfer: transfer, closingBudgetAccountBalance: balance, availableAfterPlannedAllocations,
    };
  });
  const totals = budgetAnnualTotals(budget);
  return {
    budgetId: budget.id,
    annualBudgetAccountPayments: totals.budgetAccount,
    annualContingency: Math.round(totals.budgetAccount * budget.contingencyRate * 100) / 100,
    annualExternalContributions: budget.monthlyExternalContribution * 12,
    suggestedMonthlyTransfer: transfer,
    minimumProjectedBudgetAccountBalance: minimumBalance,
    annualAvailableAfterPlannedAllocations: annualAvailable,
    months,
  };
}
