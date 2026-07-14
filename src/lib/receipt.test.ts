import { describe, expect, it } from "vitest";

import { runStudyAudit } from "./audit";
import { buildReceipt } from "./receipt";
import { analyzeStudyWithModel } from "./model";

describe("buildReceipt", () => {
  it("records both primary sources and the review findings", async () => {
    const audit = runStudyAudit();
    const analysis = await analyzeStudyWithModel(audit);
    const receipt = buildReceipt(audit, analysis);

    expect(receipt).toContain("Attention Is All You Need");
    expect(receipt).toContain("BERT: Pre-training");
    expect(receipt).toContain("Review required");
    expect(receipt).toContain("Paper anchor");
    expect(receipt).toContain("not a truth certificate");
  });
});
