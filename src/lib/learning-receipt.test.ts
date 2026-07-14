import { describe, expect, it } from "vitest";

import { getCachedLeafLensReview } from "./leaflens-cached";
import { createLearningReceipt, learningReceiptMarkdown } from "./learning-receipt";

describe("mastery receipt", () => {
  it("records attempts, mastery, unresolved concerns, sources, and provenance", () => {
    const review = getCachedLeafLensReview();
    const first = review.findings[0]!;
    const receipt = createLearningReceipt(review, {
      [first.id]: [{
        attemptNumber: 1,
        diagnosis: "Accuracy is not macro-F1 [and this text is escaped].",
        revisionPlan: "Recompute macro-F1 and report the new result.",
        status: "mastered",
        feedback: "The claim and code are now connected.",
        nextHint: null,
        masteredConcepts: ["metric selection"],
        submittedAt: "2026-07-14T18:00:00.000Z",
      }],
    });
    expect(receipt.masteredConcepts).toContain("metric selection");
    expect(receipt.unresolvedConcerns).toHaveLength(review.findings.length - 1);
    expect(receipt.sources.length).toBeGreaterThan(0);
    const markdown = learningReceiptMarkdown(receipt);
    expect(markdown).toContain("SHA-256 input hashes");
    expect(markdown).toContain("cached-demo");
    expect(markdown).toContain("\\[and this text is escaped\\]");
  });
});
