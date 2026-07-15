import { describe, expect, it } from "vitest";

import { choosePreparedDemoEntry } from "./demo-entry";

describe("prepared demo entry", () => {
  it("uses the cached demo only when live review is unavailable", () => {
    expect(choosePreparedDemoEntry({ liveReview: false, accessRequired: false })).toBe("cached");
  });

  it("starts the live demo directly when it is ungated", () => {
    expect(choosePreparedDemoEntry({ liveReview: true, accessRequired: false })).toBe("live");
  });

  it("requests access instead of silently falling back to cached output", () => {
    expect(choosePreparedDemoEntry({ liveReview: true, accessRequired: true })).toBe("request-access");
  });

  it("honors an explicit cached recovery link even when live review is available", () => {
    expect(choosePreparedDemoEntry({ liveReview: true, accessRequired: true }, true)).toBe("cached");
  });
});
