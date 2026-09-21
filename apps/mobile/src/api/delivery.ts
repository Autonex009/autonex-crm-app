import { apiFetch } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrackerRow {
  id: string;
  client: string;
  products: string | null;
  locations: string | null;
  totalCameras: number | null;
  status: string | null;
  implementationDate: string | null;
  currentStages: string | null;
  keyContacts: string | null;
  nextSteps: string | null;
  notes: string | null;
  position: number;
  dealId: string | null;
  dealTitle: string | null;
  dealStage: string | null;
  updatedBy: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerInput {
  client: string;
  products: string | null;
  locations: string | null;
  totalCameras: number | null;
  status: string | null;
  implementationDate: string | null;
  currentStages: string | null;
  keyContacts: string | null;
  nextSteps: string | null;
  notes: string | null;
}

export interface TrackerPage {
  items: TrackerRow[];
  total: number;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const BASE = "/api/v1/delivery";

export const deliveryApi = {
  list: () => apiFetch<TrackerPage>(BASE),

  create: (input: TrackerInput) =>
    apiFetch<TrackerRow>(BASE, { method: "POST", body: JSON.stringify(input) }),

  update: (id: string, input: TrackerInput) =>
    apiFetch<TrackerRow>(`${BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  remove: (id: string) => apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" }),

  reorder: (ids: string[]) =>
    apiFetch<void>(`${BASE}/reorder`, {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
};
