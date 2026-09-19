import { createApiClient } from "@go-crm/api-client";
import Constants from "expo-constants";

import { refreshTokenStore, useAuth } from "./auth";

/**
 * Base URL of the gateway.
 *
 * EXPO_PUBLIC_* is inlined at build time, same as Vite does for the web app.
 * The `extra.apiUrl` fallback exists so an EAS profile can override it without
 * a source change.
 *
 * On a physical device `localhost` is the device itself, so local development
 * needs the machine's LAN IP here — see the app's README.
 */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:8080"
).replace(/\/+$/, "");

/**
 * The app's single API client, in **token mode**.
 *
 * React Native has no dependable cookie jar across iOS and Android, and
 * SameSite means nothing outside a browser, so the client asks the gateway for
 * the refresh token in the response body (`X-Auth-Mode: token`) and stores it
 * in the Keychain itself.
 *
 * Created once at module scope. The single-flight refresh that stops N
 * concurrent 401s from spending a single-use refresh token N times lives inside
 * this object, so a second client would defeat it — which the gateway would
 * read as token theft and end every session for the user.
 */
export const api = createApiClient({
  baseUrl: API_URL,
  mode: "token",
  refreshTokenStore,
  session: {
    getAccessToken: () => useAuth.getState().token,
    setSession: (token, user) => useAuth.getState().setSession(token, user),
    clearSession: () => useAuth.getState().clear(),
  },
});

/**
 * One-time boot step: ask the gateway whether the stored refresh token still
 * names a live session.
 *
 * This is what makes the app feel signed in: the 15-minute access token is long
 * gone by the next launch, but the 30-day refresh token in the Keychain is not.
 * `refreshSession` never throws and leaves the store in `anonymous` when there
 * is nothing to recover, which is what moves the navigator off the splash.
 */
export async function bootstrapSession(): Promise<void> {
  await api.refreshSession();
  // A network failure leaves status at `unknown` so a session we could not
  // disprove is not thrown away. Nothing is signed in either way, so settle on
  // anonymous rather than hanging on the splash forever.
  if (useAuth.getState().status === "unknown") {
    useAuth.getState().clear();
  }
}
