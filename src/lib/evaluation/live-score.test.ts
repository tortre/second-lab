import { describe, expect, it } from "vitest";

import { scoreCase } from "../../../scripts/run-evaluation.mjs";

function finding(verification: "verified" | "model-located") {
  return {
    category: "metric-mismatch",
    severity: "high",
    status: verification === "verified" ? "confirmed" : "unverified",
    sourceIds: ["native-source"],
    anchors: [
      { kind: "manuscript", verification },
      { kind: "code", verification },
    ],
  };
}

describe("live evaluation evidence gate", () => {
  it("counts a category only when native sources and both supplied anchors survived verification", () => {
    const verified = scoreCase("metric", ["metric-mismatch"], [finding("verified")], true);
    expect(verified.truePositives).toBe(1);
    expect(verified.falseNegatives).toBe(0);

    const unverified = scoreCase("metric", ["metric-mismatch"], [finding("model-located")], true);
    expect(unverified.truePositives).toBe(0);
    expect(unverified.falseNegatives).toBe(1);
    expect(unverified.unsupportedHighSeverityFindings).toBe(1);
  });
});
