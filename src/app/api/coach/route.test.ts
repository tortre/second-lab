import { afterEach, describe, expect, it } from "vitest";

import { getCachedLeafLensReview } from "@/lib/leaflens-cached";
import { POST } from "./route";

const originalKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
});

describe("POST /api/coach", () => {
  it("runs the cached learning assessment without access", async () => {
    delete process.env.OPENAI_API_KEY;
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

  it("fails closed on malformed coaching input", async () => {
    const response = await POST(new Request("http://localhost/api/coach", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ diagnosis: "short" }),
    }));
    expect(response.status).toBe(400);
  });
});
