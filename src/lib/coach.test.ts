import { describe, expect, it } from "vitest";

import { assessCachedAttempt } from "./coach";
import type { EvidenceFinding } from "./review-types";

const finding: EvidenceFinding = {
  id: "leaflens-metric",
  title: "The reported metric is not calculated",
  category: "metric-mismatch",
  severity: "high",
  status: "confirmed",
  claim: "LeafLens reaches 0.91 macro-F1.",
  evidenceSummary: "The code calls accuracy_score.",
  whyItMatters: "Accuracy and macro-F1 answer different questions.",
  anchors: [{ kind: "code", fileName: "train.py", locator: "train.py:20", excerpt: "accuracy_score", lineStart: 20, lineEnd: 20, verification: "verified" }],
  sourceIds: ["src-one"],
  correction: "Calculate macro-F1 or change and qualify the claim.",
  concepts: ["metric alignment"],
};

describe("cached defend/revise coach", () => {
  it("does not master superficial metric keywords", () => {
    const result = assessCachedAttempt({
      finding,
      priorAttempts: [],
      diagnosis: "accuracy",
      revisionPlan: "f1_score",
      safetyIdentifier: "test",
    });
    expect(result.status).not.toBe("mastered");
    expect(result.masteredConcepts).toEqual([]);
  });

  it("masters an evidence-linked diagnosis and checkable revision", () => {
    const result = assessCachedAttempt({
      finding,
      priorAttempts: [],
      diagnosis: "The paper claims macro-F1, but the code calculates accuracy, which can hide weak minority-class performance.",
      revisionPlan: "Calculate f1_score with average=macro, rerun the held-out test, and report the resulting score in the paper.",
      safetyIdentifier: "test",
    });
    expect(result.status).toBe("mastered");
    expect(result.masteredConcepts).toContain("metric alignment");
  });

  it("keeps a substantive diagnosis with a vague revision at developing", () => {
    const result = assessCachedAttempt({
      finding,
      priorAttempts: [],
      diagnosis: "The paper claims macro-F1, but the code calculates accuracy, which can hide minority-class errors.",
      revisionPlan: "Use f1_score instead.",
      safetyIdentifier: "test",
    });
    expect(result.status).toBe("developing");
    expect(result.masteredConcepts).toEqual([]);
  });

  it("gives one hint, then stops hinting after an unsuccessful attempt", () => {
    const first = assessCachedAttempt({ finding, priorAttempts: [], diagnosis: "It is bad.", revisionPlan: "Fix it.", safetyIdentifier: "test" });
    expect(first.status).toBe("not-yet");
    expect(first.nextHint).toBeTruthy();
    const second = assessCachedAttempt({
      finding,
      priorAttempts: [{ attemptNumber: 1, diagnosis: "It is bad.", revisionPlan: "Fix it.", status: "not-yet", feedback: first.feedback, masteredConcepts: [], submittedAt: new Date().toISOString() }],
      diagnosis: "Still bad.",
      revisionPlan: "Change it.",
      safetyIdentifier: "test",
    });
    expect(second.nextHint).toBeNull();
  });
});
