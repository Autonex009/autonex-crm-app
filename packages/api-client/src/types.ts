/** Mirrors the auth module's User view (the API's internal/auth/store.go). */
export interface User {
  id: string;
  email: string;
  /** Display name. Set when joining via an invitation; null for plain signups. */
  name?: string | null;
  /** The tenant this user belongs to. */
  orgId?: string;
  authProvider: string;
  /** profiles.role — "owner" | "admin" | "sales" | "account_manager" | "client". */
  role?: string;
}

/** Response body of a successful /login, /register, /refresh or invitation accept. */
export interface AuthResponse {
  token: string;
  user: User;
  /** Present only in token mode — see AuthMode. */
  refreshToken?: string;
}

/**
 * How this client holds the refresh token.
 *
 * - `"cookie"` — the browser. The gateway sets an HttpOnly cookie that script
 *   cannot read, and `credentials: "include"` sends it back. Nothing to store.
 * - `"token"` — React Native. No dependable cookie jar, and SameSite means
 *   nothing off-browser, so the client asks for the token in the response body
 *   (`X-Auth-Mode: token`) and stores it itself.
 *
 * Never use `"token"` in a browser: it would put the long-lived credential where
 * script can read it, which is exactly what the HttpOnly cookie prevents.
 */
export type AuthMode = "cookie" | "token";

/**
 * Where the refresh token lives in token mode. Back it with secure storage
 * (expo-secure-store / Keychain / Keystore), never AsyncStorage.
 */
export interface RefreshTokenStore {
  get(): Promise<string | null> | string | null;
  set(token: string): Promise<void> | void;
  clear(): Promise<void> | void;
}

/**
 * The client's window onto the app's session state. Kept as callbacks so this
 * package depends on no particular store: the web app backs it with Zustand,
 * a native app can back it with anything.
 */
export interface SessionBridge {
  /** Current access token, or null when signed out. */
  getAccessToken(): string | null;
  /** A refresh or sign-in succeeded. */
  setSession(token: string, user?: User | null): void;
  /** The session ended, or boot found none. */
  clearSession(): void;
}

export interface ApiClientOptions {
  /** Base origin of the gateway, e.g. `https://apidealbridge.autonexai360.com`. */
  baseUrl: string;
  session: SessionBridge;
  /** Defaults to `"cookie"`. */
  mode?: AuthMode;
  /** Required when `mode` is `"token"`. */
  refreshTokenStore?: RefreshTokenStore;
  /** Injectable for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
}
