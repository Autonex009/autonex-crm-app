import { apiFetch } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Connection {
  provider: string;
  providerAccountId: string;
  scope: string;
  expiresAt: string | null;
  connectedAt: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const BASE = "/api/v1/integrations";

export const integrationsApi = {
  list: () => apiFetch<Connection[]>(`${BASE}/`),

  /**
   * Returns the consent URL instead of navigating to it (unlike the web app,
   * which uses window.location.assign). The caller decides how to open it
   * (e.g. Linking.openURL or expo-web-browser).
   */
  connectGoogle: async () => {
    const { authUrl } = await apiFetch<{ authUrl: string }>(`${BASE}/google/connect`, {
      method: "POST",
    });
    return authUrl;
  },

  disconnectGoogle: () => apiFetch<void>(`${BASE}/google`, { method: "DELETE" }),
};
