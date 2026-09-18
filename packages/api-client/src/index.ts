/**
 * The one way this codebase talks to autonex-crm-api.
 *
 * Platform-agnostic on purpose: it takes the base URL, the session bridge and
 * the auth mode as arguments, so the same transport, the same error handling and
 * — most importantly — the same single-flight refresh serve both the web app and
 * the native app. The refresh rule is a correctness requirement (a replayed
 * refresh token is read as theft and kills every session for the user), and it
 * is not something to reimplement twice.
 *
 * Create one client per app at startup:
 *
 *   // web
 *   createApiClient({ baseUrl: import.meta.env.PUBLIC_API_URL, session })
 *
 *   // native
 *   createApiClient({ baseUrl, session, mode: "token", refreshTokenStore })
 */
export { createApiClient } from "./client";
export type { ApiClient } from "./client";
export { ApiError, isStatus } from "./errors";
export { decodeJwt, isExpired } from "./jwt";
export type { JwtClaims } from "./jwt";
export type {
  ApiClientOptions,
  AuthMode,
  AuthResponse,
  RefreshTokenStore,
  SessionBridge,
  User,
} from "./types";
