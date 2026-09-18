/**
 * Base URL of the Go gateway API (autonex-crm-api).
 *
 * PUBLIC_API_URL is inlined into the client bundle by Vite **at build time**, so
 * changing it needs a redeploy of this app, not a restart. Dockerfile fails the
 * build when it is unset rather than shipping a bundle that silently points at
 * localhost. Falls back to the local gateway for development.
 */
export const API_URL = (import.meta.env.PUBLIC_API_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

/** Auth endpoints are mounted at /api/v1/auth by the gateway. */
export const AUTH_BASE = `${API_URL}/api/v1/auth`;
