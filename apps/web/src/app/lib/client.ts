import { createApiClient } from "@go-crm/api-client";

import { useAuthStore } from "../auth/store";
import { API_URL } from "./config";

/**
 * The web app's single API client.
 *
 * Cookie mode: the refresh token lives in an HttpOnly cookie the gateway sets,
 * so there is nothing for this app to store and nothing for script to steal. The
 * access token is held in memory by the Zustand store, which is what the session
 * bridge below reads and writes.
 *
 * Created once at module scope — `apiFetch` closes over the single-flight
 * refresh, so a second client would defeat it.
 */
export const api = createApiClient({
  baseUrl: API_URL,
  mode: "cookie",
  session: {
    getAccessToken: () => useAuthStore.getState().token,
    setSession: (token, user) => useAuthStore.getState().setSession(token, user),
    clearSession: () => useAuthStore.getState().clear(),
  },
});
