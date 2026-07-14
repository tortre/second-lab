import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("health endpoint", () => {
  it("returns only capability booleans", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("JUDGE_ACCESS_CODE", "test-code");
    vi.stubEnv("MULTI_AGENT_ENABLED", "false");

    const response = await GET();
    const body = await response.json();
    expect(body).toEqual({
      liveReview: true,
      multiAgent: false,
      accessRequired: true,
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
