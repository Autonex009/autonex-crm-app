/** Claims embedded in the access token (see the API's internal/auth/jwt.go). */
export interface JwtClaims {
  sub: string;
  email: string;
  /** Organization id — the gateway scopes every query by it. */
  org: string;
  /** profiles.role — may be absent on a token minted before roles existed. */
  role?: string;
  iss: string;
  iat: number;
  exp: number;
}

/**
 * base64url → binary string, on whichever runtime this is.
 *
 * `atob` exists in browsers and in Hermes; `Buffer` covers Node and older React
 * Native. Deliberately returns a binary string rather than decoding UTF-8, which
 * matches how this has always behaved — the fields read below are ASCII.
 */
function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const g = globalThis as { atob?: (s: string) => string; Buffer?: any };
  if (typeof g.atob === "function") return g.atob(normalized);
  if (g.Buffer) return g.Buffer.from(normalized, "base64").toString("binary");
  throw new Error("no base64 decoder on this runtime");
}

/**
 * Decodes a JWT's payload **without verifying its signature**. The gateway is the
 * only authority on validity; this exists so a client can read `sub`/`email`/
 * `exp` for display and for expiry checks without a round-trip.
 */
export function decodeJwt(token: string): JwtClaims | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    return JSON.parse(decodeBase64Url(payload)) as JwtClaims;
  } catch {
    return null;
  }
}

/** True when the token is missing/malformed or its `exp` is in the past. */
export function isExpired(claims: JwtClaims | null): boolean {
  if (!claims?.exp) return true;
  return claims.exp * 1000 <= Date.now();
}
