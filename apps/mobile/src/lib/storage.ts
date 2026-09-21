import * as SecureStore from "expo-secure-store";
import type { RefreshTokenStore } from "@go-crm/api-client";

const KEY = "go_crm_refresh_token";

/**
 * Refresh token storage backed by expo-secure-store.
 *
 * On Android this uses the Keystore; on iOS the Keychain. The token is never
 * readable by other apps or by a backup, which is the whole reason this exists
 * instead of AsyncStorage.
 */
export const refreshTokenStore: RefreshTokenStore = {
  get: () => SecureStore.getItemAsync(KEY),
  set: (token: string) => SecureStore.setItemAsync(KEY, token),
  clear: () => SecureStore.deleteItemAsync(KEY),
};

/** What a restored session needs: the access token and who it belongs to. */
export interface StoredSession {
  token: string;
  user: unknown;
}

const SESSION_KEY = "go_crm_session";

/**
 * The access token and user, persisted across app launches.
 *
 * The refresh token above is the durable half of a *password* session, but an
 * SSO sign-in arrives as a deep link carrying only an access token — the
 * gateway issues no refresh token to a native client. Without this the app
 * signed those users out on every cold start, because the boot refresh found
 * nothing in the store and cleared the session it had just been handed.
 *
 * Same Keystore/Keychain backing as the refresh token: an access token is a
 * bearer credential and has no business in AsyncStorage.
 */
export const sessionStore = {
  async get(): Promise<StoredSession | null> {
    try {
      const raw = await SecureStore.getItemAsync(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredSession;
      return typeof parsed?.token === "string" ? parsed : null;
    } catch {
      // Corrupt or unreadable — treat as "no session" rather than crashing on
      // launch, which would make the app impossible to open.
      return null;
    }
  },

  async set(session: StoredSession): Promise<void> {
    try {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    } catch {
      // A failed write costs the user a re-login later; it must never take
      // down the sign-in that just succeeded.
    }
  },

  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    } catch {
      /* nothing to do */
    }
  },
};
