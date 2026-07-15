import { afterEach, describe, expect, it, vi } from "vitest";

import { ACCESS_COOKIE_NAME } from "../../../lib/security";

import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

function accessRequest(body: object, origin = "https://secondlab.example") {
  const encoded = JSON.stringify(body);
  return new Request("https://secondlab.example/api/access", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": String(Buffer.byteLength(encoded)),
      origin,
    },
    body: encoded,
  });
}

describe("judge access endpoint", () => {
  it("rejects cross-origin requests", async () => {
    vi.stubEnv("JUDGE_ACCESS_CODE", "correct-code");
    const response = await POST(accessRequest({ code: "correct-code" }, "https://attacker.example"));
    expect(response.status).toBe(403);
  });

  it("rejects an invalid access code without setting a cookie", async () => {
    vi.stubEnv("JUDGE_ACCESS_CODE", "correct-code");
    const response = await POST(accessRequest({ code: "wrong-code" }));
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("sets a protected signed session cookie for a valid code", async () => {
    vi.stubEnv("JUDGE_ACCESS_CODE", "correct-code");
    vi.stubEnv("SESSION_SIGNING_SECRET", "independent-signing-secret");
    const response = await POST(accessRequest({ code: "correct-code" }));
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(cookie).toContain(`${ACCESS_COOKIE_NAME}=v1.`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=strict");
  });

  it("rejects an oversized streamed body without relying on Content-Length", async () => {
    vi.stubEnv("JUDGE_ACCESS_CODE", "correct-code");
    const response = await POST(new Request("https://secondlab.example/api/access", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://secondlab.example" },
      body: JSON.stringify({ code: "x".repeat(5_000) }),
    }));
    expect(response.status).toBe(413);
  });

  it("fails closed on weak production access secrets", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JUDGE_ACCESS_CODE", "short-code");
    vi.stubEnv("SESSION_SIGNING_SECRET", "also-too-short");
    const response = await POST(accessRequest({ code: "short-code" }));
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
