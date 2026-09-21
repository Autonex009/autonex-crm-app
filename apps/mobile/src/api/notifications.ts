import { apiFetch } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationItem {
  id: string;
  orgId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  priority: "info" | "success" | "warning" | "danger";
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  /**
   * `null` when the feed is empty.
   *
   * The gateway marshals a Go `[]NotificationItem` that was never appended to,
   * and a nil slice encodes as JSON `null`, not `[]`. Typing it honestly is
   * what stops a caller reaching for `.length` — which is exactly how this
   * screen crashed on a fresh account.
   */
  items: NotificationItem[] | null;
  unreadCount: number;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const BASE = "/api/v1/notifications";

export const notificationsApi = {
  list: (limit = 20, offset = 0) =>
    apiFetch<NotificationsResponse>(`${BASE}?limit=${limit}&offset=${offset}`),

  markRead: (id: string) =>
    apiFetch<void>(`${BASE}/${id}/read`, { method: "PATCH" }),

  markAllRead: () =>
    apiFetch<void>(`${BASE}/read-all`, { method: "POST" }),
};
