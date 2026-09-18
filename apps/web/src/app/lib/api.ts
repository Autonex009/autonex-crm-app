/**
 * The web app's API surface.
 *
 * Everything real lives in @go-crm/api-client, shared with the native app; this
 * module binds it to this app's configuration (see ./client) and re-exports it
 * under the names the rest of the codebase already imports. Feature modules
 * import `apiFetch` from here and do not need to know about the client object.
 */
import { api } from "./client";

export { ApiError } from "@go-crm/api-client";

/**
 * Authenticated call to the gateway: attaches the bearer token from the session
 * store to `path` (an absolute API path such as "/api/v1/contacts").
 *
 * On 401 it tries **one** silent refresh and replays the request. That is what
 * makes a 15-minute access token invisible: the token expiring mid-session costs
 * one extra round-trip, not a trip to the login screen. If the refresh fails the
 * session is cleared, and ProtectedRoute — subscribed to the store — redirects on
 * the next render.
 */
export const apiFetch = api.apiFetch;

/** Public auth calls. The caller decides when the user is signed in. */
export const authApi = {
  login: api.login,
  register: api.register,
};

/**
 * Full-page navigation target that starts the provider redirect flow. The
 * gateway redirects to the provider and, after the callback, back to
 * `/app#token=<jwt>` (captured by captureTokenFromHash) with the refresh cookie
 * already set.
 */
export const ssoUrl = api.ssoUrl;
