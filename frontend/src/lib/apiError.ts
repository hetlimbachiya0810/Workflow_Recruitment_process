/**
 * Extracts a human-readable message from an Axios error response.
 * FastAPI returns errors as { detail: string | array }.
 */
export function apiError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const e = error as { response?: { data?: { detail?: unknown } }; message?: string };
    const detail = e.response?.data?.detail;
    if (detail) {
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        // FastAPI validation errors: [{loc, msg, type}]
        return detail.map((d: { msg?: string }) => d.msg ?? String(d)).join(', ');
      }
    }
    if (e.message) return e.message;
  }
  return 'An unexpected error occurred.';
}
