import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { bootstrapSession } from "./src/lib/api";
import { RootNavigator } from "./src/navigation";
import { ThemeProvider, useSystemTheme } from "./src/theme";

/**
 * Autonex DealBridge — mobile.
 *
 * A read-only companion to the web app whose real job is notifications: a deal
 * moves, the phone buzzes, one tap lands on the record. Creating and editing
 * stay on the web, which is why there is not a form in here.
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A phone loses connectivity constantly. Two retries rides out a tunnel
      // without leaving a spinner up for a minute when the server is genuinely
      // down.
      retry: 2,
      // The app has no window focus events worth reacting to, and refetching on
      // every foreground would burn battery for data that changes hourly.
      refetchOnWindowFocus: false,
      // 401s are handled inside the API client (one silent refresh, then
      // replay), so a query never sees one unless the session is truly over.
      refetchOnReconnect: true,
    },
  },
});

function Shell() {
  const theme = useSystemTheme();

  useEffect(() => {
    // Ask the gateway whether the refresh token in the Keychain still names a
    // live session. Until it answers, the navigator shows a splash rather than
    // the sign-in screen.
    void bootstrapSession();
  }, []);

  return (
    <ThemeProvider value={theme}>
      {/* Inverted against the canvas, and it follows the OS theme. */}
      <StatusBar style={theme.scheme === "dark" ? "light" : "dark"} />
      <RootNavigator />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Shell />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
