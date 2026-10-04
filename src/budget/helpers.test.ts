import { describe, expect, it } from 'vitest';
import { annualPaymentTotal, paymentMonths, projectBudget } from './helpers';
import type { Budget, RecurringPayment } from './types';

const payment: RecurringPayment = {
  id: 'p1', name: 'Insurance', category: 'Insurance', account: 'BudgetAccount', amount: 1200,
  frequency: 'Quarterly', firstPaymentMonth: 10, selectedMonths: [], isActive: true,
};

describe('budget schedule helpers', () => {
  it('wraps recurring schedules across the calendar year', () => {
    expect(paymentMonths(payment)).toEqual([1, 4, 7, 10]);
    expect(annualPaymentTotal(payment)).toBe(4800);
  });

  it('uses only explicitly selected months', () => {
    expect(paymentMonths({ ...payment, frequency: 'SelectedMonths', selectedMonths: [12, 2, 6] })).toEqual([2, 6, 12]);
  });

  it('reconstructs the saved twelve-month projection without changing the transfer', () => {
    const budget: Budget = {
      id: 'b1', name: 'Home', currency: 'DKK', monthlyNetIncome: 30000,
      monthlyExternalContribution: 6500, quarterlyIncome: 3000, quarterlyIncomeFirstMonth: 1,
      contingencyRate: 0.1, transferRoundingIncrement: 100, openingReserve: 20000,
      forecastStartYear: 2026, forecastStartMonth: 10, lastSuggestedMonthlyTransfer: 12000,
      recurringPayments: [payment],
    };
    const projection = projectBudget(budget);
    expect(projection?.months).toHaveLength(12);
    expect(projection?.months[0]).toMatchObject({ year: 2026, month: 10, budgetAccountPayments: 1200, income: 33000 });
    expect(projection?.suggestedMonthlyTransfer).toBe(12000);
    expect(projection?.annualBudgetAccountPayments).toBe(4800);
  });
});
