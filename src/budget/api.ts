import { useMemo } from 'react';
import { useTemplate } from '../template/context';
import { API_BASE_URL } from './auth';
import type { ApiEnvelope, Budget, BudgetDraft, BudgetUpdate, PaymentDraft, RebalanceResult, RecurringPayment } from './types';

async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status === 204) return undefined;
  return contentType.includes('application/json') ? response.json() : response.text();
}

function apiError(payload: unknown, status: number) {
  const envelope = typeof payload === 'object' && payload ? payload as Partial<ApiEnvelope<unknown>> : null;
  const details = envelope?.errors?.filter(Boolean).join(' ');
  const fallback = typeof payload === 'string' && payload ? payload : `Request failed (${status}).`;
  return new Error(details || envelope?.message || fallback);
}

export function unwrapEnvelope<T>(payload: unknown): T {
  const envelope = payload as Partial<ApiEnvelope<T>>;
  if (!envelope || envelope.success !== true || envelope.data === undefined) throw apiError(payload, 200);
  return envelope.data;
}

export function useBudgetApi() {
  const { session, refreshSession } = useTemplate();
  return useMemo(() => {
    const request = async <T,>(path: string, init: RequestInit = {}, retry = true): Promise<T> => {
      if (!session) throw new Error('Sign in to continue.');
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...init.headers,
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (response.status === 401 && retry) {
        const refreshed = await refreshSession();
        const retried = await fetch(`${API_BASE_URL}${path}`, {
          ...init,
          headers: {
            Accept: 'application/json',
            ...(init.body ? { 'Content-Type': 'application/json' } : {}),
            ...init.headers,
            Authorization: `Bearer ${refreshed.accessToken}`,
          },
        });
        const retriedPayload = await readPayload(retried);
        if (!retried.ok) throw apiError(retriedPayload, retried.status);
        return retried.status === 204 ? undefined as T : unwrapEnvelope<T>(retriedPayload);
      }
      const payload = await readPayload(response);
      if (!response.ok) throw apiError(payload, response.status);
      return response.status === 204 ? undefined as T : unwrapEnvelope<T>(payload);
    };
    const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
    return {
      listBudgets: () => request<Budget[]>('/budgets'),
      getBudget: (id: string) => request<Budget>(`/budgets/${id}`),
      createBudget: (draft: BudgetDraft) => request<Budget>('/budgets', json('POST', draft)),
      updateBudget: (id: string, draft: BudgetUpdate) => request<Budget>(`/budgets/${id}`, json('PUT', draft)),
      deleteBudget: (id: string) => request<void>(`/budgets/${id}`, { method: 'DELETE' }),
      rebalance: (id: string) => request<RebalanceResult>(`/budgets/${id}/rebalance`, { method: 'POST' }),
      createPayment: (budgetId: string, draft: PaymentDraft) => request<RecurringPayment>(`/budgets/${budgetId}/recurring-payments`, json('POST', draft)),
      updatePayment: (budgetId: string, paymentId: string, draft: PaymentDraft) => request<RecurringPayment>(`/budgets/${budgetId}/recurring-payments/${paymentId}`, json('PUT', draft)),
      deletePayment: (budgetId: string, paymentId: string) => request<void>(`/budgets/${budgetId}/recurring-payments/${paymentId}`, { method: 'DELETE' }),
    };
  }, [refreshSession, session]);
}
