import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { create } from "zustand";
import { useEffect, useRef } from "react";

import { useAuth } from "./auth";
import { type PushPayload, type PushRegistration, registerForPush, setBadge } from "./push";

/**
 * Push, from the app's point of view.
 *
 * Two pieces: a tiny store holding whether this device is registered (the
 * Settings screen reads it), and a hook that wires the listeners up once at the
 * root.
 */

interface PushState {
  token: string | null;
  reason: string | null;
  set: (result: PushRegistration) => void;
}

const usePushStore = create<PushState>((set) => ({
  token: null,
  reason: null,
  set: (result) =>
    set({ token: result.token, reason: result.token ? null : (result.reason ?? null) }),
}));

export function usePushToken() {
  const token = usePushStore((s) => s.token);
  const reason = usePushStore((s) => s.reason);
  const refresh = usePushStore((s) => s.set);
  return { token, reason, refresh };
}

/**
 * Registers for push and keeps the app in step with what arrives.
 *
 * Runs only once signed in: registration is an authenticated call, and asking
 * for notification permission on the sign-in screen is the classic way to get
 * denied — the person has no idea yet what they would be agreeing to.
 */
export function usePushRegistration(onOpen: (payload: PushPayload) => void) {
  const status = useAuth((s) => s.status);
  const setResult = usePushStore((s) => s.set);
  const qc = useQueryClient();

  // Kept in a ref so re-registering does not re-subscribe the listeners, and so
  // the listener always calls the newest handler rather than a stale closure.
  const handler = useRef(onOpen);
  handler.current = onOpen;

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    void registerForPush().then((result) => {
      if (!cancelled) setResult(result);
    });

    // A notification arriving means the list this app is built around is now
    // stale. Refetch rather than splicing the payload in: the push carries a
    // summary, the API carries the truth.
    const received = Notifications.addNotificationReceivedListener(() => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    // Fires for a tap, whether the app was foregrounded, backgrounded or cold.
    const responded = Notifications.addNotificationResponseReceivedListener((response) => {
      const payload = response.notification.request.content.data as PushPayload;
      handler.current(payload);
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      cancelled = true;
      received.remove();
      responded.remove();
    };
  }, [status, setResult, qc]);
}

/**
 * Keeps the app-icon badge equal to the unread count.
 *
 * Driven from the query cache rather than from pushes, so clearing a
 * notification on the web clears the badge here on the next fetch. A badge that
 * disagrees with the list is worse than no badge at all.
 */
export function useBadgeSync(unreadCount: number | undefined) {
  useEffect(() => {
    if (unreadCount == null) return;
    void setBadge(unreadCount);
  }, [unreadCount]);
}
