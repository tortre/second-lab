import { afterEach, describe, expect, it, vi } from "vitest";

import { SESSION_TTL_SECONDS, accessCodesMatch, createSessionToken, verifySessionToken } from "./session";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("signed access sessions", () => {
  it("creates an opaque, expiring token and verifies it", () => {
    const now = Date.UTC(2026, 6, 14, 12);
    const token = createSessionToken({ now, secret: "test-signing-secret" });
    const session = verifySessionToken(token, { now, secret: "test-signing-secret" });

    expect(token).toMatch(/^v1\.[A-Za-z0-9_-]{32}\.\d+\.[A-Za-z0-9_-]+$/);
    expect(session?.sessionId).toHaveLength(32);
    expect(session?.expiresAt).toBe(session!.issuedAt + SESSION_TTL_SECONDS);
  });

  it("rejects tampered, expired, and wrongly signed tokens", () => {
    const now = Date.UTC(2026, 6, 14, 12);
    const token = createSessionToken({ now, secret: "correct-secret" });
    expect(verifySessionToken(`${token}x`, { now, secret: "correct-secret" })).toBeNull();
    expect(verifySessionToken(token, { now, secret: "wrong-secret" })).toBeNull();
    expect(verifySessionToken(token, {
      now: now + SESSION_TTL_SECONDS * 1_000,
      secret: "correct-secret",
    })).toBeNull();
  });

  it("compares access codes without exposing length-dependent byte comparison", () => {
    expect(accessCodesMatch("judge-code", "judge-code")).toBe(true);
    expect(accessCodesMatch("wrong", "judge-code")).toBe(false);
  });
});
