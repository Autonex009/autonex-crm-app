import { apiFetch } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const DEAL_STAGES = [
  "discovery",
  "site_assessment",
  "quote_sent",
  "negotiation",
  "won",
  "delivery",
  "post_delivery",
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export interface Deal {
  id: string;
  title: string;
  description: string | null;
  remark?: string | null;
  amount: number;
  stage: DealStage;
  ownerUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  contactId: string | null;
  contactName: string | null;
  accountId: string | null;
  accountName?: string | null;
  leadId: string | null;
  leadName?: string | null;
  totalCameras: number | null;
  location: string | null;
  products: string | null;
  expectedCloseDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  stages: DealStage[];
  deals: Deal[];
}

export interface DealInput {
  title: string;
  description?: string;
  remark?: string;
  amount: number;
  stage: DealStage;
  ownerUserId?: string;
  contactId?: string;
  expectedCloseDate?: string;
  accountId?: string;
  leadId?: string;
  totalCameras?: number | null;
  location?: string;
  products?: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const BASE = "/api/v1/deals";

export const dealsApi = {
  board: () => apiFetch<Board>(BASE),

  get: (id: string) => apiFetch<Deal>(`${BASE}/${id}`),

  create: (input: DealInput) =>
    apiFetch<Deal>(BASE, { method: "POST", body: JSON.stringify(input) }),

  update: (id: string, input: DealInput) =>
    apiFetch<Deal>(`${BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  remove: (id: string) => apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" }),

  move: (id: string, stage: DealStage, index: number) =>
    apiFetch<Deal>(`${BASE}/${id}/move`, {
      method: "PATCH",
      body: JSON.stringify({ stage, index }),
    }),
};
