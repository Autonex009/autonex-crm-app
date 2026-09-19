import type { User } from "@go-crm/api-client";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

/**
 * Session state for the app.
 *
 * Mirrors the web app's store on purpose — same three-state `status`, same
 * "access token in memory only" rule. What differs is where the durable half
 * lives: the browser gets an HttpOnly cookie it cannot read, while here the
 * refresh token goes into the Keychain / Android Keystore through
 * expo-secure-store.
 *
 * Never AsyncStorage. That is a plain unencrypted file, readable on a rooted or
 * jailbroken device and included in some backup paths, and this is a 30-day
 * credential.
 */

const REFRESH_KEY = "autonex.refresh";

type Status = "unknown" | "authenticated" | "anonymous";

interface AuthState {
  token: string | null;
  user: User | null;
  /**
   * `unknown` is the boot state: there may or may not be a session behind the
   * stored refresh token, and we cannot tell until the refresh answers. The
   * navigator shows a splash rather than the sign-in screen while it is
   * unknown, or every cold start would flash the login form at someone who is
   * signed in.
   */
  status: Status;
  setSession: (token: string, user?: User | null) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  status: "unknown",
  setSession: (token, user) =>
    set((s) => ({ token, user: user ?? s.user, status: "authenticated" })),
  clear: () => set({ token: null, user: null, status: "anonymous" }),
}));

/**
 * The refresh token's home, in the shape `@go-crm/api-client` expects.
 *
 * Every method swallows its own failure. SecureStore throws when the keychain is
 * unavailable — a locked device during a background fetch, a simulator with a
 * broken keychain — and a throw here would reject the refresh and sign a
 * perfectly valid session out. Returning null instead just means "ask them to
 * sign in", which is recoverable.
 */
export const refreshTokenStore = {
  async get(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  async set(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_KEY, token, {
        // Readable only while the device is unlocked, and never migrated to a
        // new phone in a backup — a restored refresh token would be a session
        // handed to whoever restored it.
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch {
      // Losing the token costs one sign-in; failing the call loses the session.
    }
  },
  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    } catch {
      // Already gone, or unreadable. Either way there is nothing to do.
    }
  },
};
