import { apiFetch } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const ACTIVITY_KINDS = ["note", "call", "email", "meeting", "site_visit"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number] | "system";

export interface Activity {
  id: string;
  kind: ActivityKind;
  subject: string | null;
  body: string | null;
  occurredAt: string;
  durationMinutes: number | null;
  leadId: string | null;
  dealId: string | null;
  accountId: string | null;
  contactId: string | null;
  quoteId: string | null;
  invoiceId: string | null;
  leadName: string | null;
  dealTitle: string | null;
  accountName: string | null;
  contactName: string | null;
  createdBy: string | null;
  authorName: string | null;
  authorEmail: string | null;
  createdAt: string;
}

export interface ActivityScope {
  leadId?: string;
  dealId?: string;
  accountId?: string;
  contactId?: string;
  quoteId?: string;
  invoiceId?: string;
}

export interface ActivityInput extends ActivityScope {
  kind: ActivityKind;
  subject?: string;
  body?: string;
  occurredAt?: string;
  durationMinutes?: number;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const BASE = "/api/v1/activities";

function scopeQuery(scope: ActivityScope, limit?: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(scope)) {
    if (value) params.set(key, value);
  }
  if (limit) params.set("limit", String(limit));
  const q = params.toString();
  return q ? `?${q}` : "";
}

export const activitiesApi = {
  list: (scope: ActivityScope = {}, limit?: number) =>
    apiFetch<Activity[]>(`${BASE}${scopeQuery(scope, limit)}`),

  create: (input: ActivityInput) =>
    apiFetch<Activity>(BASE, { method: "POST", body: JSON.stringify(input) }),

  update: (id: string, input: Omit<ActivityInput, keyof ActivityScope>) =>
    apiFetch<Activity>(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(input) }),

  remove: (id: string) => apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" }),
};
