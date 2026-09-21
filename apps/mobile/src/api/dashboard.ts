import { apiFetch } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StageSummary {
  stage: string;
  count: number;
  value: number;
}

export interface Pipeline {
  total: number;
  open: number;
  won: number;
  stages: StageSummary[];
}

export interface Attention {
  kind: "lead" | "quote" | "invoice" | "deal" | "action" | "task";
  id: string;
  label: string;
  detail: string;
  days: number;
  amount: number;
}

export interface Recent {
  kind: string;
  entity: string;
  subject: string;
  body: string;
  actor: string;
  actionUrl: string;
  at: string;
}

export interface Summary {
  contacts: number;
  members: number;
  leads: Pipeline;
  deals: Pipeline;
  quotes: Pipeline;
  invoices: { total: number; outstanding: number; overdue: number; paid: number };
  attention: Attention[];
  recent: Recent[];
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const dashboardApi = {
  summary: () => apiFetch<Summary>("/api/v1/dashboard"),
};
