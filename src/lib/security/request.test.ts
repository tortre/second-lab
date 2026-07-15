import { afterEach, describe, expect, it, vi } from "vitest";

import { createSafetyIdentifier, isSameOriginRequest, readBoundedJson, RequestBodyTooLargeError } from "./request";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("request security", () => {
  it("requires an exact same origin", () => {
    expect(isSameOriginRequest(new Request("https://secondlab.example/api/review", {
      headers: { origin: "https://secondlab.example" },
    }))).toBe(true);
    expect(isSameOriginRequest(new Request("https://secondlab.example/api/review", {
      headers: { origin: "https://attacker.example" },
    }))).toBe(false);
    expect(isSameOriginRequest(new Request("https://secondlab.example/api/review"))).toBe(false);
  });

  it("accepts the configured production origin", () => {
    vi.stubEnv("APP_ORIGIN", "https://secondlab.example");
    expect(isSameOriginRequest(new Request("https://preview.example/api/review", {
      headers: { origin: "https://secondlab.example" },
    }))).toBe(true);
  });

  it("accepts localhost when the local server is bound to all interfaces", () => {
    expect(isSameOriginRequest(new Request("http://0.0.0.0:3000/api/review", {
      headers: { origin: "http://localhost:3000" },
    }))).toBe(true);
  });

  it("derives a fixed-size safety identifier from only the opaque session id", () => {
    const safetyId = createSafetyIdentifier("opaque-session-id");
    expect(safetyId).toMatch(/^[a-f0-9]{64}$/);
    expect(safetyId).not.toContain("opaque-session-id");
  });

  it("bounds streamed JSON even when Content-Length is missing", async () => {
    const accepted = await readBoundedJson(new Request("https://secondlab.example/api/test", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
    }), 64);
    expect(accepted).toEqual({ ok: true });

    await expect(readBoundedJson(new Request("https://secondlab.example/api/test", {
      method: "POST",
      body: JSON.stringify({ value: "x".repeat(100) }),
    }), 64)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });
});
