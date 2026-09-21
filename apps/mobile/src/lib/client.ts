import { createApiClient } from "@go-crm/api-client";

import { useAuthStore } from "../store/auth";
import { refreshTokenStore } from "./storage";

/**
 * Base URL of the Go gateway API.
 *
 * EXPO_PUBLIC_API_URL is baked into the JS bundle by Metro at build time.
 * On a physical device `localhost` is the device itself, so for local dev you
 * must set this to your machine's LAN IP; the production API works from
 * anywhere with internet.
 */
const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || "https://apidealbridge.autonexai360.com";

/**
 * The mobile app's single API client.
 *
 * Token mode: the refresh token is stored in expo-secure-store (Android
 * Keystore / iOS Keychain). The gateway returns it in the response body when
 * the `X-Auth-Mode: token` header is set, and we persist it ourselves. There
 * is no cookie jar in React Native, so SameSite is meaningless.
 *
 * Created once at module scope — `apiFetch` closes over the single-flight
 * refresh, so a second client would defeat it.
 */
export const api = createApiClient({
  baseUrl: API_URL,
  mode: "token",
  refreshTokenStore,
  session: {
    getAccessToken: () => useAuthStore.getState().token,
    setSession: (token, user) => useAuthStore.getState().setSession(token, user),
    clearSession: () => useAuthStore.getState().clear(),
  },
});
