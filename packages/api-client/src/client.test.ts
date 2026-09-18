import { beforeEach, describe, expect, test, vi } from "vitest";

import { createApiClient } from "./client";
import { ApiError } from "./errors";
import type { RefreshTokenStore, SessionBridge } from "./types";

const BASE = "https://api.test";

/** A SessionBridge backed by a plain object, with spies on the writes. */
function makeSession(token: string | null = "access-1") {
  const state = { token, cleared: 0, set: [] as string[] };
  const session: SessionBridge = {
    getAccessToken: () => state.token,
    setSession: (t) => {
      state.token = t;
      state.set.push(t);
    },
    clearSession: () => {
      state.token = null;
      state.cleared += 1;
    },
  };
  return { session, state };
}

function makeStore(initial: string | null = "refresh-1") {
  const state = { value: initial, cleared: 0 };
  const store: RefreshTokenStore = {
    get: () => state.value,
    set: (t) => {
      state.value = t;
    },
    clear: () => {
      state.value = null;
      state.cleared += 1;
    },
  };
  return { store, state };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiFetch", () => {
  let fetchImpl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchImpl = vi.fn();
  });

  test("prepends the base URL and attaches the bearer token", async () => {
    // Arrange
    const { session } = makeSession("access-1");
    fetchImpl.mockResolvedValue(jsonResponse({ id: "lead-1" }));
    const api = createApiClient({ baseUrl: BASE, session, fetchImpl: fetchImpl as never });

    // Act
    const out = await api.apiFetch<{ id: string }>("/api/v1/leads/lead-1");

    // Assert
    expect(out).toEqual({ id: "lead-1" });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(`${BASE}/api/v1/leads/lead-1`);
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer access-1");
  });

  test("trims trailing slashes from the base URL", async () => {
    const { session } = makeSession();
    fetchImpl.mockResolvedValue(jsonResponse({}));
    const api = createApiClient({
      baseUrl: `${BASE}///`,
      session,
      fetchImpl: fetchImpl as never,
    });

    await api.apiFetch("/api/v1/deals");

    expect(fetchImpl.mock.calls[0][0]).toBe(`${BASE}/api/v1/deals`);
  });

  test("returns undefined for 204 rather than parsing an empty body", async () => {
    const { session } = makeSession();
    fetchImpl.mockResolvedValue(new Response(null, { status: 204 }));
    const api = createApiClient({ baseUrl: BASE, session, fetchImpl: fetchImpl as never });

    await expect(api.apiFetch("/api/v1/leads/x")).resolves.toBeUndefined();
  });

  test("surfaces the gateway's error message with its status", async () => {
    const { session } = makeSession();
    fetchImpl.mockResolvedValue(jsonResponse({ error: "lead not found" }, 404));
    const api = createApiClient({ baseUrl: BASE, session, fetchImpl: fetchImpl as never });

    await expect(api.apiFetch("/api/v1/leads/x")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "lead not found",
    });
  });

  test("reports a transport failure as status 0, not as a server error", async () => {
    // A server that is down and a server that returned 500 need different
    // handling, so they must not collapse into the same error.
    const { session } = makeSession();
    fetchImpl.mockRejectedValue(new TypeError("Failed to fetch"));
    const api = createApiClient({ baseUrl: BASE, session, fetchImpl: fetchImpl as never });

    const err = await api.apiFetch("/api/v1/leads").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
  });

  test("does not set Content-Type for FormData", async () => {
    // The browser must set it itself so the multipart boundary is included;
    // a boundary-less header makes every upload fail to parse server-side.
    const { session } = makeSession();
    fetchImpl.mockResolvedValue(jsonResponse({}));
    const api = createApiClient({ baseUrl: BASE, session, fetchImpl: fetchImpl as never });

    await api.apiFetch("/api/v1/delivery/import", {
      method: "POST",
      body: new FormData(),
    });

    expect(new Headers(fetchImpl.mock.calls[0][1].headers).get("Content-Type")).toBeNull();
  });

  test("sets Content-Type for a JSON body", async () => {
    const { session } = makeSession();
    fetchImpl.mockResolvedValue(jsonResponse({}));
    const api = createApiClient({ baseUrl: BASE, session, fetchImpl: fetchImpl as never });

    await api.apiFetch("/api/v1/leads", { method: "POST", body: JSON.stringify({}) });

    expect(new Headers(fetchImpl.mock.calls[0][1].headers).get("Content-Type")).toBe(
      "application/json",
    );
  });
});

describe("401 handling", () => {
  test("refreshes once and replays the request with the new token", async () => {
    // Arrange
    const { session, state } = makeSession("stale");
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "invalid token" }, 401))
      .mockResolvedValueOnce(jsonResponse({ token: "fresh", user: { id: "u1" } }))
      .mockResolvedValueOnce(jsonResponse({ id: "lead-1" }));
    const api = createApiClient({ baseUrl: BASE, session, fetchImpl: fetchImpl as never });

    // Act
    const out = await api.apiFetch<{ id: string }>("/api/v1/leads/lead-1");

    // Assert
    expect(out).toEqual({ id: "lead-1" });
    expect(fetchImpl.mock.calls[1][0]).toBe(`${BASE}/api/v1/auth/refresh`);
    expect(state.token).toBe("fresh");
    expect(new Headers(fetchImpl.mock.calls[2][1].headers).get("Authorization")).toBe(
      "Bearer fresh",
    );
  });

  test("issues exactly one refresh for concurrent 401s", async () => {
    // The single-flight guard is a correctness requirement, not an optimisation:
    // refresh tokens are single-use, and the gateway reads a replayed one as
    // theft and kills every session for the user. Three parallel 401s must
    // produce one rotation.
    const { session } = makeSession("stale");
    let refreshes = 0;
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).endsWith("/auth/refresh")) {
        refreshes += 1;
        // Resolve on a later tick so all three callers are genuinely in flight.
        await new Promise((r) => setTimeout(r, 5));
        return jsonResponse({ token: "fresh", user: { id: "u1" } });
      }
      return session.getAccessToken() === "fresh"
        ? jsonResponse({ ok: true })
        : jsonResponse({ error: "invalid token" }, 401);
    });
    const api = createApiClient({ baseUrl: BASE, session, fetchImpl: fetchImpl as never });

    const results = await Promise.all([
      api.apiFetch("/api/v1/leads"),
      api.apiFetch("/api/v1/deals"),
      api.apiFetch("/api/v1/quotes"),
    ]);

    expect(refreshes).toBe(1);
    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
  });

  test("clears the session and rethrows the 401 when the refresh fails", async () => {
    const { session, state } = makeSession("stale");
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "invalid token" }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: "session expired" }, 401));
    const api = createApiClient({ baseUrl: BASE, session, fetchImpl: fetchImpl as never });

    await expect(api.apiFetch("/api/v1/leads")).rejects.toMatchObject({ status: 401 });
    expect(state.cleared).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2); // no second replay
  });

  test("does not retry a non-401 failure", async () => {
    const { session } = makeSession();
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: "nope" }, 403));
    const api = createApiClient({ baseUrl: BASE, session, fetchImpl: fetchImpl as never });

    await expect(api.apiFetch("/api/v1/leads")).rejects.toMatchObject({ status: 403 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("allows a fresh refresh after an earlier one settled", async () => {
    // The in-flight guard must be released in a finally, or the first failure
    // would wedge the client for the rest of the session.
    const { session } = makeSession(null);
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: "no session" }, 401));
    const api = createApiClient({ baseUrl: BASE, session, fetchImpl: fetchImpl as never });

    await expect(api.refreshSession()).resolves.toBe(false);
    await expect(api.refreshSession()).resolves.toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe("cookie mode", () => {
  test("sends credentials so the HttpOnly refresh cookie travels", async () => {
    const { session } = makeSession();
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}));
    const api = createApiClient({ baseUrl: BASE, session, fetchImpl: fetchImpl as never });

    await api.apiFetch("/api/v1/leads");

    expect(fetchImpl.mock.calls[0][1].credentials).toBe("include");
    expect(new Headers(fetchImpl.mock.calls[0][1].headers).get("X-Auth-Mode")).toBeNull();
  });

  test("login does not set the session — the caller decides when to sign in", async () => {
    const { session, state } = makeSession(null);
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ token: "t", user: { id: "u1" } }));
    const api = createApiClient({ baseUrl: BASE, session, fetchImpl: fetchImpl as never });

    await api.login("a@b.com", "password");

    expect(state.set).toEqual([]);
    expect(state.token).toBeNull();
  });
});

describe("token mode (native clients)", () => {
  test("requires a refresh token store", () => {
    const { session } = makeSession();
    expect(() => createApiClient({ baseUrl: BASE, session, mode: "token" })).toThrow(
      /refreshTokenStore/,
    );
  });

  test("asks for the token in the body and sends no cookie credentials", async () => {
    const { session } = makeSession();
    const { store } = makeStore();
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}));
    const api = createApiClient({
      baseUrl: BASE,
      session,
      mode: "token",
      refreshTokenStore: store,
      fetchImpl: fetchImpl as never,
    });

    await api.apiFetch("/api/v1/leads");

    const init = fetchImpl.mock.calls[0][1];
    expect(new Headers(init.headers).get("X-Auth-Mode")).toBe("token");
    expect(init.credentials).toBeUndefined();
  });

  test("stores the rotated refresh token on login", async () => {
    const { session } = makeSession(null);
    const { store, state } = makeStore(null);
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ token: "t", user: { id: "u1" }, refreshToken: "r1" }));
    const api = createApiClient({
      baseUrl: BASE,
      session,
      mode: "token",
      refreshTokenStore: store,
      fetchImpl: fetchImpl as never,
    });

    await api.login("a@b.com", "password");

    expect(state.value).toBe("r1");
  });

  test("posts the stored token and overwrites it with the rotation", async () => {
    const { session } = makeSession("stale");
    const { store, state } = makeStore("r1");
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ token: "fresh", user: { id: "u1" }, refreshToken: "r2" }));
    const api = createApiClient({
      baseUrl: BASE,
      session,
      mode: "token",
      refreshTokenStore: store,
      fetchImpl: fetchImpl as never,
    });

    await expect(api.refreshSession()).resolves.toBe(true);

    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ refreshToken: "r1" });
    expect(state.value).toBe("r2");
  });

  test("clears storage when the server rejects the refresh token", async () => {
    const { session, state: sessionState } = makeSession("stale");
    const { store, state } = makeStore("r1");
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: "session expired" }, 401));
    const api = createApiClient({
      baseUrl: BASE,
      session,
      mode: "token",
      refreshTokenStore: store,
      fetchImpl: fetchImpl as never,
    });

    await expect(api.refreshSession()).resolves.toBe(false);

    expect(state.value).toBeNull();
    expect(sessionState.cleared).toBe(1);
  });

  test("does not call the server when there is no stored token", async () => {
    const { session } = makeSession(null);
    const { store } = makeStore(null);
    const fetchImpl = vi.fn();
    const api = createApiClient({
      baseUrl: BASE,
      session,
      mode: "token",
      refreshTokenStore: store,
      fetchImpl: fetchImpl as never,
    });

    await expect(api.refreshSession()).resolves.toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test("logout revokes server-side and clears local storage", async () => {
    const { session, state: sessionState } = makeSession("access");
    const { store, state } = makeStore("r1");
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const api = createApiClient({
      baseUrl: BASE,
      session,
      mode: "token",
      refreshTokenStore: store,
      fetchImpl: fetchImpl as never,
    });

    await api.endSession();

    expect(fetchImpl.mock.calls[0][0]).toBe(`${BASE}/api/v1/auth/logout`);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ refreshToken: "r1" });
    expect(state.cleared).toBe(1);
    expect(sessionState.cleared).toBe(1);
  });

  test("clears the local session even when logout cannot reach the server", async () => {
    const { session, state: sessionState } = makeSession("access");
    const { store } = makeStore("r1");
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("offline"));
    const api = createApiClient({
      baseUrl: BASE,
      session,
      mode: "token",
      refreshTokenStore: store,
      fetchImpl: fetchImpl as never,
    });

    await expect(api.endSession()).resolves.toBeUndefined();
    expect(sessionState.cleared).toBe(1);
  });
});

describe("ssoUrl", () => {
  test("points at the gateway's provider route", () => {
    const { session } = makeSession();
    const api = createApiClient({ baseUrl: BASE, session });
    expect(api.ssoUrl("google")).toBe(`${BASE}/api/v1/auth/sso/google`);
  });
});
