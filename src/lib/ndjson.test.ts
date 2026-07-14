import { describe, expect, it } from "vitest";

import { parseReviewEventLine } from "./ndjson";

describe("review stream parser", () => {
  it("parses an agent event", () => {
    expect(parseReviewEventLine('{"event":"agent.started","agent":"/root/claims","role":"Claim mapper"}')).toEqual({
      event: "agent.started",
      agent: "/root/claims",
      role: "Claim mapper",
    });
  });

  it("rejects malformed and unknown events", () => {
    expect(() => parseReviewEventLine("not json")).toThrow("malformed JSON");
    expect(() => parseReviewEventLine('{"event":"pretend.stage"}')).toThrow("Unknown review event");
  });
});
