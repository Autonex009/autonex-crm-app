/**
 * Session lifecycle against the refresh cookie.
 *
 * Kept as its own module rather than folded into lib/api.ts because the split
 * predates the shared client and every call site imports from here. The
 * implementation — including the single-flight refresh, which stops N concurrent
 * 401s from spending a single-use refresh token N times — lives in
 * @go-crm/api-client.
 */
import { api } from "../lib/client";

/**
 * Exchanges the refresh cookie for a new access token. Returns whether a session
 * was recovered. Never throws.
 */
export const refreshSession = api.refreshSession;

/** Revokes the session server-side, then clears it locally. */
export const endSession = api.endSession;
