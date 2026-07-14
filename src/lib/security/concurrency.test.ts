import { describe, expect, it } from "vitest";

import { acquireReviewLease } from "./concurrency";

describe("review concurrency lease", () => {
  it("permits one active review per session and releases the slot", () => {
    const first = acquireReviewLease("session-one");
    const blocked = acquireReviewLease("session-one");
    expect(first.acquired).toBe(true);
    expect(blocked.acquired).toBe(false);

    first.release();
    const next = acquireReviewLease("session-one");
    expect(next.acquired).toBe(true);
    next.release();
  });

  it("does not let a stale release clear a newer lease", () => {
    const first = acquireReviewLease("session-two");
    first.release();
    const second = acquireReviewLease("session-two");
    first.release();
    expect(acquireReviewLease("session-two").acquired).toBe(false);
    second.release();
  });
});
