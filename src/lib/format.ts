/**
 * Formatting helpers.
 *
 * Locale and currency are hardcoded here rather than read from the
 * store config. Making currency per-store-configurable is a
 * footgun: flipping from USD to EUR would relabel existing prices
 * without converting them. Real multi-currency is a significant
 * feature (storing prices per currency, handling conversion rates)
 * that deserves its own design when the need arises.
 */

const LOCALE = "en-US";
const CURRENCY = "USD";

/** Format cents as a localized currency string, e.g. 2499 -> "$24.99" */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(cents / 100);
}

/** "Mar 14, 2026" */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
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
