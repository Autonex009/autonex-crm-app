/**
 * The mobile app's API surface.
 *
 * Everything real lives in @go-crm/api-client, shared with the web app; this
 * module binds it to this app's configuration (see ./client) and re-exports it
 * under the names the rest of the codebase imports.
 */
import { api } from "./client";

export { ApiError } from "@go-crm/api-client";

/**
 * Authenticated call to the gateway: attaches the bearer token from the auth
 * store. On 401 it tries one silent refresh and replays the request.
 */
export const apiFetch = api.apiFetch;

/** Public auth calls. The caller decides when the user is signed in. */
export const authApi = {
  login: api.login,
  register: api.register,
};

/** Refresh the session (used at boot). */
export const refreshSession = api.refreshSession;

/** End the session (logout). */
export const endSession = api.endSession;

/**
 * SSO URL for a provider. On native this would need expo-auth-session and a
 * custom-scheme callback, which the gateway does not implement yet — kept here
 * for completeness.
 */
export const ssoUrl = api.ssoUrl;
