/**
 * Date helpers, ported from apps/web/src/app/deals/stages.ts.
 *
 * Dates from the API are DATE-only (no time). Parsing them with `new Date(iso)`
 * would read them as UTC midnight and shift them a day backwards west of
 * Greenwich, so the parts are read out by hand instead.
 */
function parts(iso: string | null | undefined): [number, number, number] | null {
  if (!iso) return null;
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return [year, month, day];
}

/** "12 Mar", or an em dash when absent. */
export function formatDate(iso: string | null | undefined): string {
  const p = parts(iso);
  if (!p) return "—";
  return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** "12 Mar 2026" — for detail screens, where the year matters. */
export function formatDateLong(iso: string | null | undefined): string {
  const p = parts(iso);
  if (!p) return "—";
  return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Days until the date; negative means overdue. */
export function daysUntil(iso: string | null | undefined): number | null {
  const p = parts(iso);
  if (!p) return null;
  const target = new Date(p[0], p[1] - 1, p[2]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Coarse relative time for timestamps ("3h ago"). Timestamps are full ISO
 * datetimes, so these can be parsed directly.
 */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return formatDate(iso);
}
