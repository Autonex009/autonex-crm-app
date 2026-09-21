/**
 * Stage display metadata for leads and deals.
 *
 * Ported from apps/web/src/app/leads/api.ts and apps/web/src/app/deals/stages.ts.
 * The web attaches a Tailwind class per stage; here the tone resolves to a
 * palette pair at render time instead, but the label and tone per stage are
 * deliberately identical so a lead reads "Deck sent" in brand purple on both.
 */
import { LEAD_STAGES, type LeadStage } from "../api/leads";
import { DEAL_STAGES, type DealStage } from "../api/deals";
import type { Tone } from "../theme";

export { LEAD_STAGES, DEAL_STAGES };
export type { LeadStage, DealStage };

interface StageMeta {
  label: string;
  tone: Tone;
}

export const LEAD_STAGE_META: Record<LeadStage, StageMeta> = {
  new: { label: "New", tone: "neutral" },
  "initial count": { label: "Initial count", tone: "info" },
  "deck sent": { label: "Deck sent", tone: "brand" },
  "call scheduled": { label: "Call scheduled", tone: "warning" },
  "call done": { label: "Call done", tone: "success" },
  "proposal sent": { label: "Proposal sent", tone: "success" },
  closed: { label: "Closed", tone: "success" },
  "not interested": { label: "Not interested", tone: "danger" },
  converted: { label: "Converted", tone: "success" },
};

export const DEAL_STAGE_META: Record<DealStage, StageMeta> = {
  discovery: { label: "Discovery", tone: "neutral" },
  site_assessment: { label: "Site assessment", tone: "brand" },
  quote_sent: { label: "Quote sent", tone: "info" },
  negotiation: { label: "Negotiation", tone: "warning" },
  delivery: { label: "Delivery", tone: "info" },
  post_delivery: { label: "Post delivery", tone: "info" },
  won: { label: "Won", tone: "success" },
};

/**
 * Normalizes the legacy stage names the API can still return. Mirrors
 * normalizeDealStage on the web — without it an older deal lands in no column.
 */
export function normalizeDealStage(raw?: string | null): DealStage {
  if (!raw) return "discovery";
  const s = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  switch (s) {
    case "prospect":
    case "lead":
      return "discovery";
    case "proposal":
      return "quote_sent";
    case "qualified":
      return "site_assessment";
    default:
      return (DEAL_STAGES as readonly string[]).includes(s) ? (s as DealStage) : "discovery";
  }
}

export function leadStageMeta(stage?: string | null): StageMeta {
  return LEAD_STAGE_META[stage as LeadStage] ?? { label: stage || "New", tone: "neutral" };
}

export function dealStageMeta(stage?: string | null): StageMeta {
  return DEAL_STAGE_META[normalizeDealStage(stage)];
}

/** Quote and invoice statuses share a simple status → tone map. */
export function documentStatusTone(status: string): Tone {
  switch (status) {
    case "approved":
    case "paid":
      return "success";
    case "sent":
      return "info";
    case "rejected":
    case "expired":
      return "danger";
    case "void":
      return "neutral";
    default:
      return "neutral";
  }
}

/** "quote_sent" → "Quote sent"; the generic fallback for any other enum. */
export function humanize(value: string): string {
  const spaced = value.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
