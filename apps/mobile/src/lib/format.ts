/**
 * Display formatting.
 *
 * Kept in one module because these are the values that appear on every screen,
 * and two screens formatting money differently is the sort of thing nobody
 * reports but everybody notices.
 */

/**
 * Money, in the Indian numbering system.
 *
 * `en-IN` rather than a generic grouping: ₹24,50,000 is lakhs-and-crores
 * grouping, and a deal value shown as ₹2,450,000 reads as a different number to
 * someone used to the former.
 *
 * No decimals — CRM amounts are whole rupees and two trailing zeroes on every
 * row is noise in a narrow column.
 */
const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function money(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return rupees.format(amount);
}

/**
 * Money, abbreviated for tight places like a stage header.
 *
 * Lakh and crore rather than K/M, for the same reason as the grouping above.
 */
export function moneyShort(amount: number | null | undefined): string {
  if (amount == null) return "—";
  const abs = Math.abs(amount);
  if (abs >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(abs >= 100_000_000 ? 0 : 1)}Cr`;
  if (abs >= 100_000) return `₹${(amount / 100_000).toFixed(abs >= 1_000_000 ? 0 : 1)}L`;
  if (abs >= 1_000) return `₹${(amount / 1_000).toFixed(0)}K`;
  return `₹${amount}`;
}

/**
 * Relative time, coarse on purpose.
 *
 * "3d" not "3 days, 4 hours". On a list row the unit of decision is "is this
 * recent or stale", and precision beyond that competes with the content for
 * attention.
 */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return shortDate(iso);
}

/** "12 Sep" — the year only once it stops being obvious. */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/**
 * Days until a date, negative when it has passed.
 *
 * Compared at day boundaries, not by dividing elapsed milliseconds: something
 * due at 9am today is "today", not "-1 day", and only a date-level comparison
 * gets that right.
 */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(target) - startOfDay(new Date())) / 86_400_000);
}

/** "Overdue by 3d" / "Due today" / "in 5d" — the phrasing a follow-up needs. */
export function dueLabel(iso: string | null | undefined): string {
  const days = daysUntil(iso);
  if (days == null) return "No follow-up";
  if (days === 0) return "Due today";
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

/** Turns a snake_case stage into "Site assessment". */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Initials for an avatar dot, at most two letters. */
export function initials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
