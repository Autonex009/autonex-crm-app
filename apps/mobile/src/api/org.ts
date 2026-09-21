import { apiFetch } from "../lib/api";
import type { AuthResponse } from "@go-crm/api-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Member {
  id: string;
  email: string;
  name: string | null;
  authProvider: string;
  role?: string;
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
}

export interface NewInvitation extends Invitation {
  inviteUrl: string;
}

export interface Workspace {
  id: string;
  name: string;
  currency: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const BASE = "/api/v1/org";

export const orgApi = {
  workspace: () => apiFetch<Workspace>(BASE),

  updateWorkspace: (patch: { name?: string; currency?: string }) =>
    apiFetch<Workspace>(BASE, { method: "PATCH", body: JSON.stringify(patch) }),

  members: () => apiFetch<Member[]>(`${BASE}/members`),

  invitations: () => apiFetch<Invitation[]>(`${BASE}/invitations`),

  invite: (email: string) =>
    apiFetch<NewInvitation>(`${BASE}/invitations`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  revoke: (id: string) =>
    apiFetch<void>(`${BASE}/invitations/${id}`, { method: "DELETE" }),

  updateMemberRole: (id: string, role: string) =>
    apiFetch<Member>(`${BASE}/members/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  /** Public: the invite token in the link is the credential. */
  accept: (token: string, name: string, password: string) =>
    apiFetch<AuthResponse>(`${BASE}/invitations/accept`, {
      method: "POST",
      body: JSON.stringify({ token, name, password }),
    }),
};
