import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const securityMocks = vi.hoisted(() => ({ getAccessDecision: vi.fn() }));

vi.mock("@/lib/security", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/security")>();
  return { ...actual, getAccessDecision: securityMocks.getAccessDecision };
});

import { getCachedLeafLensReview } from "@/lib/leaflens-cached";
import { POST } from "./route";

const originalKey = process.env.OPENAI_API_KEY;

beforeEach(() => {
  securityMocks.getAccessDecision.mockResolvedValue({
    allowed: true,
    accessRequired: false,
    sessionId: "test-session",
  });
});

afterEach(() => {
  securityMocks.getAccessDecision.mockReset();
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
});

describe("POST /api/coach", () => {
  it("runs the cached learning assessment without access", async () => {
    process.env.OPENAI_API_KEY = "test-key-that-must-not-be-used";
    const finding = getCachedLeafLensReview().findings[0]!;
    const response = await POST(new Request("http://localhost/api/coach", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({
        finding,
        priorAttempts: [],
        diagnosis: "Accuracy is not macro-F1 and can hide minority-class errors.",
        revisionPlan: "Recompute f1_score with macro averaging and report the result.",
        reviewExecutionMode: "cached-demo",
      }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "mastered", executionMode: "cached-demo" });
  });

  it("binds public cached coaching to the server-owned LeafLens finding", async () => {
    process.env.OPENAI_API_KEY = "test-key-that-must-not-be-used";
    const finding = getCachedLeafLensReview().findings[0]!;
    const response = await POST(new Request("http://localhost/api/coach", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({
        finding: { ...finding, category: "data-leakage" },
        priorAttempts: [],
        diagnosis: "Accuracy is not macro-F1 and can hide minority-class errors.",
        revisionPlan: "Recompute f1_score with macro averaging and report the result.",
        reviewExecutionMode: "cached-demo",
      }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "mastered", executionMode: "cached-demo" });
  });

  it("does not let a forged cached-demo finding bypass judge access", async () => {
    securityMocks.getAccessDecision.mockResolvedValue({
      allowed: false,
      accessRequired: true,
      sessionId: null,
    });
    const finding = getCachedLeafLensReview().findings[0]!;
    const response = await POST(new Request("http://localhost/api/coach", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({
        finding: { ...finding, id: "forged-private-finding" },
        priorAttempts: [],
        diagnosis: "Accuracy is not macro-F1 and can hide minority-class errors.",
        revisionPlan: "Recompute f1_score with macro averaging and report the result.",
        reviewExecutionMode: "cached-demo",
      }),
    }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Judge access is required for live coaching." });
  });

  it("fails closed on malformed coaching input", async () => {
    const response = await POST(new Request("http://localhost/api/coach", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ diagnosis: "short" }),
    }));
    expect(response.status).toBe(400);
  });

  it("rejects an oversized streamed body without relying on Content-Length", async () => {
    const response = await POST(new Request("http://localhost/api/coach", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ padding: "x".repeat(33_000) }),
    }));
    expect(response.status).toBe(413);
  });
});
