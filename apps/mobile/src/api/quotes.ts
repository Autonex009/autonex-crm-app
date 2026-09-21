import { apiFetch } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const QUOTE_STATUSES = ["draft", "sent", "approved", "rejected", "expired"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export interface QuoteItem {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  lineTotal: number;
}

export interface Quote {
  id: string;
  number: string;
  title: string | null;
  status: QuoteStatus;
  currency: string;
  accountId: string | null;
  accountName: string | null;
  contactId: string | null;
  contactName: string | null;
  dealId: string | null;
  dealTitle: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  notes: string | null;
  validUntil: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  sentAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  createdAt: string;
  updatedAt: string;
  template: string | null;
  proposal?: unknown;
  items?: QuoteItem[];
  itemCount: number;
}

export interface QuotePage {
  items: Quote[];
  total: number;
  limit: number;
  offset: number;
}

export interface QuoteItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
}

export interface QuoteInput {
  title?: string;
  accountId?: string;
  contactId?: string;
  dealId?: string;
  ownerUserId?: string;
  notes?: string;
  validUntil?: string;
  items: QuoteItemInput[];
  template?: string;
  proposal?: unknown;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const PAGE_SIZE = 25;

const BASE = "/api/v1/quotes";

export const quotesApi = {
  list: (offset = 0, status = "", limit = PAGE_SIZE) =>
    apiFetch<QuotePage>(
      `${BASE}?limit=${limit}&offset=${offset}${status ? `&status=${status}` : ""}`,
    ),

  get: (id: string) => apiFetch<Quote>(`${BASE}/${id}`),

  create: (input: QuoteInput) =>
    apiFetch<Quote>(BASE, { method: "POST", body: JSON.stringify(input) }),

  update: (id: string, input: QuoteInput) =>
    apiFetch<Quote>(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(input) }),

  setStatus: (id: string, status: QuoteStatus) =>
    apiFetch<Quote>(`${BASE}/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  remove: (id: string) => apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" }),
};
