import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./api";

/**
 * Server state.
 *
 * Every shape here mirrors the gateway's response exactly — see
 * autonex-crm-api/docs/API.md, which is the contract of record. Nothing is
 * reshaped on the way in: a field renamed here is a field nobody can grep for
 * when the API changes.
 *
 * The app is read-only apart from marking notifications read, so there are four
 * queries and two mutations in total.
 */

// --- shapes ---

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  priority: "info" | "success" | "warning" | "danger";
  isRead: boolean;
  createdAt: string;
}

export interface Deal {
  id: string;
  title: string;
  amount: number;
  stage: string;
  accountId: string | null;
  accountName?: string | null;
  contactName: string | null;
  ownerName: string | null;
  location: string | null;
  totalCameras: number | null;
  expectedCloseDate: string | null;
  updatedAt: string;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  accountName: string | null;
  stage: string;
  value: number | null;
  ownerName: string | null;
  followUpAt: string | null;
  overdue: boolean;
  dueToday: boolean;
  lastContactedAt: string | null;
}

export interface Account {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  ownerName: string | null;
  contactCount: number;
  dealCount: number;
  leadCount: number;
}

export interface AccountLocation {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  spocName: string | null;
  spocPhone: string | null;
  archivedAt: string | null;
  dealCount: number;
}

// --- queries ---

/**
 * Notifications. This is the home screen, so it is the one query with a short
 * stale time: a push arriving is a signal that this list is out of date.
 */
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api.apiFetch<{ items: NotificationItem[]; unreadCount: number }>(
        "/api/v1/notifications?limit=50",
      ),
    staleTime: 30_000,
  });
}

/**
 * The whole deal board in one request — that is the shape the gateway returns,
 * and the list screen groups it client-side. Fine at CRM scale: a board is
 * hundreds of deals, not millions, and one request beats seven.
 */
export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: () => api.apiFetch<{ stages: string[]; deals: Deal[] }>("/api/v1/deals"),
    staleTime: 120_000,
  });
}

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: () => api.apiFetch<{ items: Lead[]; total: number }>("/api/v1/leads?limit=100"),
    staleTime: 120_000,
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.apiFetch<{ items: Account[]; total: number }>("/api/v1/accounts?limit=100"),
    staleTime: 300_000,
  });
}

/** A company's sites, for the detail screen's "call the SPOC / navigate" row. */
export function useAccountLocations(accountId: string | null) {
  return useQuery({
    queryKey: ["accounts", accountId, "locations"],
    enabled: !!accountId,
    queryFn: () =>
      api.apiFetch<{ items: AccountLocation[] }>(`/api/v1/accounts/${accountId}/locations`),
    staleTime: 300_000,
  });
}

// --- mutations ---

/**
 * Marks one notification read.
 *
 * Optimistic, because the user has just tapped the row and is already watching
 * it: waiting a round-trip to drop the unread dot makes the tap feel broken.
 * The snapshot is restored on failure so a dropped request cannot silently eat
 * an unread flag.
 */
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.apiFetch<void>(`/api/v1/notifications/${id}/read`, { method: "PATCH" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const previous = qc.getQueryData<{ items: NotificationItem[]; unreadCount: number }>([
        "notifications",
      ]);
      if (previous) {
        qc.setQueryData(["notifications"], {
          ...previous,
          items: previous.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          unreadCount: Math.max(0, previous.unreadCount - 1),
        });
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(["notifications"], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.apiFetch<void>("/api/v1/notifications/read-all", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
