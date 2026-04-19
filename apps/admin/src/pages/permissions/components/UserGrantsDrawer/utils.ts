const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * Convert an ISO string (RFC3339) into the "YYYY-MM-DDTHH:mm" shape expected
 * by <input type="datetime-local">. Returns "" for null / invalid.
 */
export const toDatetimeLocal = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

/**
 * Convert the "datetime-local" value back to an ISO string (UTC).
 * Returns null for empty / invalid input.
 */
export const fromDatetimeLocal = (value: string): string | null => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

export const formatExpiresForDisplay = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export const isExpired = (iso: string | null | undefined): boolean => {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
};
