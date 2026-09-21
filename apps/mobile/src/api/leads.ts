import { apiFetch } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const LEAD_STAGES = [
  "new",
  "initial count",
  "deck sent",
  "call scheduled",
  "call done",
  "proposal sent",
  "closed",
  "not interested",
  "converted",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export interface Lead {
  id: string;
  firstName: string;
  lastName: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  source: string | null;
  notes: string | null;
  value: number | null;
  stage: LeadStage;
  accountId: string | null;
  accountName: string | null;
  accountIndustry: string | null;
  company: string | null;
  contactId: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  followUpAt: string | null;
  overdue: boolean;
  dueToday: boolean;
  lastContactedAt: string | null;
  convertedAt: string | null;
  convertedDealId: string | null;
  convertedContactId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadPage {
  items: Lead[];
  total: number;
  limit: number;
  offset: number;
  counts: Record<string, number>;
  stages: LeadStage[];
}

export interface LeadInput {
  firstName: string;
  lastName?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  company?: string;
  accountId?: string;
  contactId?: string;
  source?: string;
  notes?: string;
  value?: number;
  stage: LeadStage;
  ownerUserId?: string;
  followUpAt?: string;
}

export interface AdvanceInput {
  toStage: LeadStage;
  followUpAt?: string;
  clearFollowUp?: boolean;
  note?: string;
  meetingAt?: string;
  meetingMinutes?: number;
  attendees?: string[];
  inviteConfirmed?: boolean;
}

export interface Meeting {
  googleEventId: string;
  meetLink: string;
  title: string;
  startAt: string;
  endAt: string;
}

export interface AdvanceResult {
  lead: Lead;
  meeting?: Meeting;
}

export interface ConvertInput {
  title?: string;
  dealTitle?: string;
  amount?: number;
  expectedCloseDate?: string;
  stage?: string;
  dealStage?: string;
  ownerUserId?: string;
  accountId?: string;
  totalCameras?: number | null;
  location?: string;
  products?: string;
  description?: string;
  callNotes?: string;
}

export interface Conversion {
  leadId: string;
  contactId: string;
  dealId: string;
  accountId: string;
  contactCreated: boolean;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const PAGE_SIZE = 25;

const BASE = "/api/v1/leads";

export const leadsApi = {
  list: (
    offset = 0,
    filter = "",
    limit = PAGE_SIZE,
    opts: { search?: string; accountId?: string; sort?: string } = {},
  ) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (filter) params.set("filter", filter);
    if (opts.search?.trim()) params.set("search", opts.search.trim());
    if (opts.accountId) params.set("accountId", opts.accountId);
    if (opts.sort) params.set("sort", opts.sort);
    return apiFetch<LeadPage>(`${BASE}?${params}`);
  },

  get: (id: string) => apiFetch<Lead>(`${BASE}/${id}`),

  create: (input: LeadInput) =>
    apiFetch<Lead>(BASE, { method: "POST", body: JSON.stringify(input) }),

  update: (id: string, input: LeadInput) =>
    apiFetch<Lead>(`${BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  advance: (id: string, input: AdvanceInput) =>
    apiFetch<AdvanceResult>(`${BASE}/${id}/advance`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  convert: (id: string, input: ConvertInput = {}) =>
    apiFetch<Conversion>(`${BASE}/${id}/convert`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  remove: (id: string) => apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" }),
};
