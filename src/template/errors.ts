export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; response?: { data?: { message?: unknown; title?: unknown } } };
    const apiMessage = candidate.response?.data?.message ?? candidate.response?.data?.title ?? candidate.message;
    if (typeof apiMessage === 'string' && apiMessage) return apiMessage;
  }
  return fallback;
}
