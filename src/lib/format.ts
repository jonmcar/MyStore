import { STORE } from "./config";

/** Format cents as a localized currency string, e.g. 2499 -> "$24.99" */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat(STORE.locale, {
    style: "currency",
    currency: STORE.currency,
  }).format(cents / 100);
}

/** "Mar 14, 2026" */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(STORE.locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

/** Human-readable duration, e.g. 90 -> "1h 30m", 60 -> "1h", 45 -> "45m" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Generate a short pseudo-order-id like "MER-K3F9-8821" */
export function generateOrderId(): string {
  const part = () =>
    Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return `MER-${part()}-${part()}`;
}
