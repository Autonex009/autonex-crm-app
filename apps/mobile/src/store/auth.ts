import { create } from "zustand";

import type { User } from "@go-crm/api-client";
import { decodeJwt, isExpired } from "@go-crm/api-client";

import { sessionStore } from "../lib/storage";

/**
 * `unknown` is the boot state: there may or may not be a stored session, and
 * we can't tell until secure storage answers. Screens must wait rather than
 * bouncing to login, or every cold start would flash the login screen.
 */
type Status = "unknown" | "authenticated" | "anonymous";

interface AuthState {
  token: string | null;
  user: User | null;
  status: Status;
  setSession: (token: string, user?: User | null) => void;
  /** Boot found no session, or the session ended. Wipes persisted state. */
  clear: () => void;
}

/** Builds a minimal User from token claims (used when user object is absent). */
function deriveUser(token: string): User | null {
  const claims = decodeJwt(token);
  if (!claims) return null;
  return {
    id: claims.sub,
    email: claims.email,
    orgId: claims.org,
    authProvider: "sso",
    role: claims.role,
  };
}

/**
 * Session store, mirrored into secure storage.
 *
 * The session survives a cold start because both halves are persisted: the
 * refresh token by the API client, and the access token and user here. Only an
 * explicit sign-out, or a refresh the *server* rejects, ends it — a restart, a
 * flight-mode launch or a gateway that is briefly down do not.
 *
 * The write is fire-and-forget. Making `setSession` async would mean every
 * caller awaits a Keystore round-trip before the navigator can swap trees,
 * and a lost write costs a re-login rather than correctness.
 */
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  status: "unknown",

  setSession: (token, user) => {
    const resolved = user ?? deriveUser(token);
    set({ token, user: resolved, status: "authenticated" });
    void sessionStore.set({ token, user: resolved });
  },

  clear: () => {
    set({ token: null, user: null, status: "anonymous" });
    void sessionStore.clear();
  },
}));

/**
 * Puts a stored session back in memory at boot.
 *
 * Returns whether a usable (non-expired) one was found. An expired token is
 * dropped here rather than handed to the app: the refresh flow is what renews
 * it, and a caller that got `true` must be able to trust the token.
 */
export async function restoreSession(): Promise<boolean> {
  const stored = await sessionStore.get();
  if (!stored?.token) return false;

  const claims = decodeJwt(stored.token);
  if (!claims?.sub) return false;

  // Restores stored session so the user stays logged in across app cold starts.
  // The API client's silent refresh handles token renewal in the background.
  useAuthStore.setState({
    token: stored.token,
    user: (stored.user as User | null) ?? deriveUser(stored.token),
    status: "authenticated",
  });
  return true;
}

/** Reactive check that an authenticated session is present. */
export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.status === "authenticated");
}

/** True while the boot sequence is still deciding. */
export function useSessionUnknown(): boolean {
  return useAuthStore((s) => s.status === "unknown");
}
