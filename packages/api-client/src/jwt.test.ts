import { describe, expect, test, vi } from "vitest";

import { decodeJwt, isExpired } from "./jwt";

/** Builds an unsigned JWT with the given payload; the signature is never read. */
function makeToken(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.signature`;
}

describe("decodeJwt", () => {
  test("reads the claims the client needs", () => {
    // Arrange
    const token = makeToken({
      sub: "user-1",
      email: "a@autonexai360.com",
      org: "org-1",
      role: "admin",
      iss: "go-crm",
      iat: 1,
      exp: 2,
    });

    // Act
    const claims = decodeJwt(token);

    // Assert
    expect(claims).toMatchObject({ sub: "user-1", org: "org-1", role: "admin" });
  });

  test("decodes base64url padding variants", () => {
    // The gateway emits base64url, so '-' and '_' must map back to '+' and '/'
    // or a payload containing them fails to parse.
    const claims = decodeJwt(makeToken({ sub: "a?b>c", email: "x@y.z", org: "o" }));
    expect(claims?.sub).toBe("a?b>c");
  });

  test("returns null for a token with no payload segment", () => {
    expect(decodeJwt("not-a-jwt")).toBeNull();
  });

  test("returns null rather than throwing on a malformed payload", () => {
    expect(decodeJwt("header.!!!not-base64!!!.sig")).toBeNull();
  });
});

describe("isExpired", () => {
  test("is true when exp is in the past", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    expect(isExpired({ exp: Date.now() / 1000 - 1 } as never)).toBe(true);
    vi.useRealTimers();
  });

  test("is false when exp is in the future", () => {
    expect(isExpired({ exp: Date.now() / 1000 + 900 } as never)).toBe(false);
  });

  test("treats a missing token or a token without exp as expired", () => {
    // Failing closed matters: a claimless token must not read as a live session.
    expect(isExpired(null)).toBe(true);
    expect(isExpired({} as never)).toBe(true);
  });
});
