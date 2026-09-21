import { useEffect } from "react";
import { Linking } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { decodeJwt, type User } from "@go-crm/api-client";

import { refreshSession } from "./src/lib/api";
import { refreshTokenStore } from "./src/lib/storage";
import { RootNavigator } from "./src/navigation";
import { restoreSession, useAuthStore } from "./src/store/auth";
import { ThemeProvider, useTheme, useThemeHydration } from "./src/theme";
import { ErrorBoundary, LoadingState, Screen } from "./src/ui";

// Ensure the API client module initializes at import time.
import "./src/lib/client";

/**
 * Query defaults tuned for a phone: a CRM record is not worth refetching on
 * every screen focus over a mobile connection, and a failed request on a
 * flaky link deserves one retry rather than three.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Reads an SSO callback deep link (`...#token=<jwt>`) and signs the user in.
 *
 * Returns whether it found one, because the boot sequence must not then go on
 * to overwrite the session it just established.
 */
function consumeSsoLink(incomingUrl: string | null): boolean {
  if (!incomingUrl) return false;

  const tokenMatch = incomingUrl.match(/[#?&]token=([^&]+)/);
  if (!tokenMatch?.[1]) return false;

  try {
    const token = decodeURIComponent(tokenMatch[1]);
    const claims = decodeJwt(token);
    if (!claims?.sub) return false;

    const refreshMatch = incomingUrl.match(/[#?&]refresh_token=([^&]+)/);
    if (refreshMatch?.[1]) {
      const refreshToken = decodeURIComponent(refreshMatch[1]);
      void refreshTokenStore.set(refreshToken);
    }

    const user: User = {
      id: claims.sub,
      email: claims.email || "",
      name: (claims as any).name || claims.email?.split("@")[0] || "User",
      role: (claims.role as any) || "owner",
      orgId: claims.org || "",
      authProvider: "google",
    };
    useAuthStore.getState().setSession(token, user);
    return true;
  } catch {
    return false;
  }
}

/**
 * Boot: recover the session, in the order that cannot lose one.
 *
 * 1. An SSO deep link wins outright — it is a sign-in happening right now.
 * 2. Otherwise restore what is in secure storage, so the app is usable
 *    immediately and offline.
 * 3. Then, and only if a refresh token exists, renew in the background.
 *
 * Step 3 is conditional for a reason. `refreshSession` clears the session when
 * it finds no refresh token, and the gateway issues none to a native SSO
 * client — so running it unconditionally signed every Google and GitHub user
 * out one tick after they signed in, and again on every cold start. The
 * session now ends only on an explicit sign-out or on a refresh the *server*
 * rejects; a restart, a dead network or a gateway that is briefly down do not
 * touch it.
 */
function useBootSession() {
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const initialUrl = await Linking.getInitialURL().catch(() => null);
      if (cancelled) return;

      const fromSso = consumeSsoLink(initialUrl);
      const restored = fromSso || (await restoreSession());
      if (cancelled) return;

      // `get` is typed as sync-or-async, so it is normalised rather than
      // assumed to be a promise.
      let hasRefreshToken = false;
      try {
        hasRefreshToken = !!(await Promise.resolve(refreshTokenStore.get()));
      } catch {
        hasRefreshToken = false;
      }
      if (cancelled) return;

      if (hasRefreshToken) {
        // Rotates the pair and extends the session. On a server rejection the
        // client clears everything itself, which is the one correct sign-out.
        await refreshSession();
        return;
      }

      // No refresh token: an SSO session, or none at all. Leave the restored
      // one alone and only fall to the login screen when there is nothing.
      if (!restored && !useAuthStore.getState().token) {
        useAuthStore.getState().clear();
      }
    };

    void boot();

    // A link arriving while the app is already open is a fresh sign-in.
    const sub = Linking.addEventListener("url", (e) => consumeSsoLink(e.url));

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);
}

function AppShell() {
  const { dark } = useTheme();
  const themeReady = useThemeHydration();

  useBootSession();

  // Wait for the stored theme before the first paint, or a dark-mode user sees
  // a white flash while the preference loads.
  if (!themeReady) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <>
      {/* Translucent with a transparent background on Android too: the canvas
          then runs under the status bar and every screen's SafeAreaView is
          what inserts the gap, so the two platforms inset identically. */}
      <StatusBar style={dark ? "light" : "dark"} translucent backgroundColor="transparent" />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {/* Inside the theme so the fallback is themed, outside the query
            client so a failure in either one still lands on a real screen
            rather than a blank one in a release build. */}
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AppShell />
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
