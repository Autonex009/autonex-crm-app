import { ApiError } from "./errors";
import type {
  ApiClientOptions,
  AuthMode,
  AuthResponse,
  RefreshTokenStore,
  SessionBridge,
} from "./types";

/** Header a native client sends to get the refresh token in the body. */
const AUTH_MODE_HEADER = "X-Auth-Mode";

export interface ApiClient {
  /** Base origin, trailing slashes trimmed. */
  readonly baseUrl: string;
  /** `<baseUrl>/api/v1/auth` — where the auth routes are mounted. */
  readonly authBase: string;
  /**
   * Authenticated call. `path` is an absolute API path such as
   * `/api/v1/contacts`; the base URL is prepended.
   */
  apiFetch<T>(path: string, init?: RequestInit): Promise<T>;
  login(email: string, password: string): Promise<AuthResponse>;
  register(email: string, password: string, name?: string): Promise<AuthResponse>;
  /** Exchanges the refresh credential for a new access token. Never throws. */
  refreshSession(): Promise<boolean>;
  /** Revokes the session server-side, then clears it locally. Never throws. */
  endSession(): Promise<void>;
  /** Full-page navigation target that starts the provider redirect flow. */
  ssoUrl(provider: "google" | "github"): string;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const authBase = `${baseUrl}/api/v1/auth`;
  const mode: AuthMode = options.mode ?? "cookie";
  const session: SessionBridge = options.session;
  const store: RefreshTokenStore | undefined = options.refreshTokenStore;
  const doFetch: typeof fetch = options.fetchImpl ?? ((...a) => globalThis.fetch(...a));

  if (mode === "token" && !store) {
    throw new Error('createApiClient: mode "token" requires a refreshTokenStore');
  }

  /** Performs the call and normalizes both transport and API-level failures. */
  async function request<T>(url: string, init: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await doFetch(url, init);
    } catch {
      // Network-level failure (server down, CORS, offline).
      throw new ApiError(0, "Could not reach the server. Is the gateway running?");
    }

    // 204 No Content (e.g. DELETE) has no body to parse.
    if (res.status === 204) {
      return undefined as T;
    }

    const data = (await res.json().catch(() => ({}))) as { error?: string } & Partial<T>;
    if (!res.ok) {
      throw new ApiError(res.status, data.error ?? "Request failed");
    }
    return data as T;
  }

  /** Adds the mode header, and `credentials` only where a cookie is in play. */
  function authInit(init: RequestInit = {}): RequestInit {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (mode === "token") {
      headers.set(AUTH_MODE_HEADER, "token");
      return { ...init, headers };
    }
    return { ...init, credentials: "include", headers };
  }

  function buildInit(init: RequestInit, token: string | null): RequestInit {
    const base = authInit(init);
    const headers = new Headers(base.headers);
    // FormData sets its own Content-Type, including the multipart boundary the
    // server needs to split the parts. Setting it here would send a boundary-less
    // header and every upload would fail to parse.
    if (init.body !== undefined && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return { ...base, headers };
  }

  /** Public auth calls (login/register), which carry no bearer token. */
  async function postAuth<T>(path: string, body: unknown): Promise<T> {
    const init = authInit({
      method: "POST",
      body: JSON.stringify(body),
    });
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    return request<T>(`${authBase}${path}`, { ...init, headers });
  }

  /**
   * Persists the refresh half of a session. In cookie mode the gateway already
   * did it via Set-Cookie and there is nothing to do.
   *
   * Deliberately does **not** touch the access token: `login`/`register` return
   * the response and let the caller decide when the user is signed in (the login
   * screen navigates first), which is how the web app has always worked.
   * `refreshSession` is the one path that sets the session itself, because no
   * caller is watching.
   */
  async function persistRefresh(data: AuthResponse): Promise<void> {
    if (mode === "token" && data.refreshToken) {
      // Rotation: the token just used is spent, so overwrite before anything
      // else can read the old one.
      await store!.set(data.refreshToken);
    }
  }

  /**
   * In-flight refresh, so N concurrent 401s produce one rotation.
   *
   * This matters for correctness, not just efficiency: refresh tokens are
   * single-use, so two parallel refreshes would spend the same token twice — and
   * the server reads a replayed token as theft and kills every session for the
   * user.
   */
  let inFlight: Promise<boolean> | null = null;

  function refreshSession(): Promise<boolean> {
    if (inFlight) return inFlight;

    inFlight = (async () => {
      try {
        const init = authInit({ method: "POST" });
        const headers = new Headers(init.headers);
        let body: string | undefined;

        if (mode === "token") {
          const refreshToken = await store!.get();
          if (!refreshToken) {
            session.clearSession();
            return false;
          }
          headers.set("Content-Type", "application/json");
          body = JSON.stringify({ refreshToken });
        }

        const res = await doFetch(`${authBase}/refresh`, { ...init, headers, body });
        if (!res.ok) {
          if (mode === "token") await store!.clear();
          session.clearSession();
          return false;
        }

        const data = (await res.json()) as AuthResponse;
        await persistRefresh(data);
        session.setSession(data.token, data.user);
        return true;
      } catch {
        // Network failure: don't wipe a session we can't disprove — but the store
        // still needs to leave the `unknown` boot state.
        if (!session.getAccessToken()) session.clearSession();
        return false;
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  }

  async function endSession(): Promise<void> {
    try {
      const init = authInit({ method: "POST" });
      const headers = new Headers(init.headers);
      let body: string | undefined;
      if (mode === "token") {
        const refreshToken = await store!.get();
        if (refreshToken) {
          headers.set("Content-Type", "application/json");
          body = JSON.stringify({ refreshToken });
        }
      }
      await doFetch(`${authBase}/logout`, { ...init, headers, body });
    } catch {
      // Even if the call fails, drop the local session — the access token expires
      // within minutes regardless.
    }
    if (mode === "token") await store!.clear();
    session.clearSession();
  }

  /**
   * Authenticated call to the gateway.
   *
   * On 401 it tries **one** silent refresh and replays the request. That is what
   * makes a 15-minute access token invisible: the token expiring mid-session
   * costs one extra round-trip, not a trip to the login screen. If the refresh
   * fails the session is cleared, and the app's route guard redirects.
   */
  async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${baseUrl}${path}`;

    try {
      return await request<T>(url, buildInit(init, session.getAccessToken()));
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) throw err;

      // Single-flight inside refreshSession, so parallel 401s rotate once.
      const recovered = await refreshSession();
      if (!recovered) throw err;

      return request<T>(url, buildInit(init, session.getAccessToken()));
    }
  }

  return {
    baseUrl,
    authBase,
    apiFetch,
    login: async (email, password) => {
      const data = await postAuth<AuthResponse>("/login", { email, password });
      await persistRefresh(data);
      return data;
    },
    register: async (email, password, name) => {
      const data = await postAuth<AuthResponse>("/register", { email, password, name });
      await persistRefresh(data);
      return data;
    },
    refreshSession,
    endSession,
    /**
     * The gateway redirects to the provider and, after the callback, back to
     * `<web>/app#token=<jwt>` with the refresh cookie already set. Browser only —
     * a native client needs expo-auth-session and a custom-scheme callback, which
     * the gateway does not implement yet.
     */
    ssoUrl: (provider) => `${authBase}/sso/${provider}`,
  };
}
