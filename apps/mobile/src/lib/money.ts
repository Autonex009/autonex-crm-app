/**
 * Money formatting, ported from apps/web/src/app/lib/money.ts.
 *
 * Same cache, same three modes, same fallback — a value must never render as
 * "$48,000" on the web and "48000 USD" on the phone.
 *
 * Hermes ships full ICU for Intl.NumberFormat on both platforms in RN 0.74, so
 * this behaves as it does in the browser.
 */
const cache = new Map<string, Intl.NumberFormat>();

type Mode = "auto" | "exact" | "compact";

function formatter(currency: string, mode: Mode): Intl.NumberFormat {
  const key = `${currency}:${mode}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    ...(mode === "compact"
      ? { notation: "compact", maximumFractionDigits: 1 }
      : mode === "exact"
        ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        : { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
  };

  let made: Intl.NumberFormat;
  try {
    made = new Intl.NumberFormat(undefined, options);
  } catch {
    // An unknown-but-well-formed code makes Intl throw; grouped plain numbers
    // beat a crashed screen.
    made = new Intl.NumberFormat(undefined, {
      ...(mode === "compact"
        ? { notation: "compact", maximumFractionDigits: 1 }
        : { minimumFractionDigits: mode === "exact" ? 2 : 0, maximumFractionDigits: 2 }),
    });
  }

  cache.set(key, made);
  return made;
}

/** Tiles and totals: "$48,000", "$34.65" — cents only when there are cents. */
export function formatMoney(value: number | null | undefined, currency: string): string {
  if (value === null || value === undefined) return "—";
  return formatter(currency, "auto").format(value);
}

/** Always two decimals, for documents (quote and invoice lines). */
export function formatMoneyExact(value: number | null | undefined, currency: string): string {
  if (value === null || value === undefined) return "—";
  return formatter(currency, "exact").format(value);
}

/** Compact form for cards and column headers: "$48K". */
export function formatMoneyCompact(value: number | null | undefined, currency: string): string {
  if (value === null || value === undefined || value === 0) return "—";
  if (Math.abs(value) < 1000) return formatMoney(value, currency);
  return formatter(currency, "compact").format(value);
}
