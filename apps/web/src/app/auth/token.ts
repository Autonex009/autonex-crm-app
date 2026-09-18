/**
 * Token helpers. Decoding lives in @go-crm/api-client (the native app needs it
 * too); the SSO fragment capture below is browser-only and stays here.
 */
export { decodeJwt, isExpired } from "@go-crm/api-client";
export type { JwtClaims } from "@go-crm/api-client";

/**
 * SSO delivers the access token in the URL fragment (`/app#token=<jwt>`), which
 * is never sent to a server. Read it once on boot and strip it from the URL so
 * it doesn't linger in history or get copy-pasted.
 */
export function captureTokenFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash.startsWith("#")) return null;

  const token = new URLSearchParams(hash.slice(1)).get("token");
  if (!token) return null;

  history.replaceState(null, "", window.location.pathname + window.location.search);
  return token;
}
