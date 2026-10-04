export type PaymentAccount = 'BudgetAccount' | 'DailyAccount';
export type PaymentFrequency = 'Monthly' | 'Quarterly' | 'SemiAnnual' | 'Annual' | 'SelectedMonths';

export interface RecurringPayment {
  id: string;
  name: string;
  category: string;
  account: PaymentAccount;
  amount: number;
  frequency: PaymentFrequency;
  firstPaymentMonth: number;
  selectedMonths: number[];
  isActive: boolean;
  notes?: string | null;
}

export interface Budget {
  id: string;
  name: string;
  currency: string;
  monthlyNetIncome: number;
  monthlyExternalContribution: number;
  quarterlyIncome: number;
  quarterlyIncomeFirstMonth: number;
  contingencyRate: number;
  transferRoundingIncrement: number;
  openingReserve: number;
  forecastStartYear: number;
  forecastStartMonth: number;
  lastSuggestedMonthlyTransfer?: number | null;
  lastRebalancedAt?: string | null;
  recurringPayments: RecurringPayment[];
}

export interface BudgetDraft {
  name: string;
  currency: string;
  monthlyNetIncome: number;
  monthlyExternalContribution: number;
  quarterlyIncome: number;
  quarterlyIncomeFirstMonth: number;
  contingencyRate: number;
  transferRoundingIncrement: number;
  openingReserve: number;
  forecastStartYear: number;
  forecastStartMonth: number;
}

export type BudgetUpdate = Omit<BudgetDraft, 'currency'>;

export interface PaymentDraft {
  name: string;
  category: string;
  account: PaymentAccount;
  amount: number;
  frequency: PaymentFrequency;
  firstPaymentMonth: number;
  selectedMonths: number[];
  isActive: boolean;
  notes: string;
}

export interface MonthlyProjection {
  year: number;
  month: number;
  budgetAccountPayments: number;
  dailyAccountPayments: number;
  income: number;
  suggestedTransfer: number;
  closingBudgetAccountBalance: number;
  availableAfterPlannedAllocations: number;
}

export interface RebalanceResult {
  budgetId: string;
  annualBudgetAccountPayments: number;
  annualContingency: number;
  annualExternalContributions: number;
  suggestedMonthlyTransfer: number;
  minimumProjectedBudgetAccountBalance: number;
  annualAvailableAfterPlannedAllocations: number;
  months: MonthlyProjection[];
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string | null;
  errors?: string[] | null;
}
