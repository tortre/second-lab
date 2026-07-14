import { describe, expect, it } from "vitest";

import { runStudyAudit } from "./audit";

describe("runStudyAudit", () => {
  it("reviews both paper packages and returns source-grounded findings", () => {
    const audit = runStudyAudit();
    const failed = audit.findings.filter((finding) => finding.status === "fail");

    expect(audit.paperCount).toBe(2);
    expect(audit.papers.map((paper) => paper.paperId)).toEqual(["attention", "bert"]);
    expect(failed).toHaveLength(2);
    expect(failed.map((finding) => finding.paperId)).toEqual(["attention", "bert"]);
    expect(audit.receiptStatus).toBe("Review required");
  });

  it("is deterministic across repeated runs", () => {
    expect(runStudyAudit()).toEqual(runStudyAudit());
  });

  it("keeps evidence anchored to the cited paper sections", () => {
    const audit = runStudyAudit();

    expect(audit.findings.every((finding) => finding.paperAnchor.length > 0)).toBe(true);
    expect(audit.datasetFingerprint).toMatch(/^fnv1a-[0-9a-f]{8}$/);
  });
});
