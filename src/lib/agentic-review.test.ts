import { describe, expect, it } from "vitest";

import { buildManuscriptReceipt, validateManuscriptFiles, type ManuscriptReview } from "./agentic-review";

describe("manuscript review boundary", () => {
  it("accepts supported manuscript and source files", () => {
    expect(() => validateManuscriptFiles({
      manuscript: new File(["draft"], "paper.pdf", { type: "application/pdf" }),
      codeFiles: [new File(["print('ok')"], "model.py", { type: "text/x-python" })],
    })).not.toThrow();
  });

  it("rejects archives and empty manuscripts", () => {
    expect(() => validateManuscriptFiles({
      manuscript: new File([], "paper.pdf", { type: "application/pdf" }),
      codeFiles: [],
    })).toThrow("non-empty manuscript");
    expect(() => validateManuscriptFiles({
      manuscript: new File(["draft"], "paper.pdf", { type: "application/pdf" }),
      codeFiles: [new File(["archive"], "code.zip", { type: "application/zip" })],
    })).toThrow("not a supported text or source-code file");
  });

  it("builds a receipt with literature, confidence, and limitations", () => {
    const review: ManuscriptReview = {
      mode: "gpt-5.6-files-web",
      manuscript: { title: "A New Method", authors: ["A. Researcher"], researchArea: "Machine learning", centralClaims: ["The method improves accuracy."], claimedContributions: ["A new training procedure."] },
      reviewSummary: "One source-grounded issue requires review.",
      researchTrace: [{ stage: "manuscript", detail: "Read the uploaded draft." }],
      checks: [{ label: "Method parity", rationale: "Compare manuscript and code.", status: "review" }],
      findings: [{ title: "Method mismatch", category: "manuscript-code-consistency", severity: "high", confidence: 0.9, evidence: "The described and implemented settings differ.", manuscriptAnchor: "Section 3", codeAnchor: "model.py:10", literatureContext: "Prior evaluations use the documented setting.", correction: "Align the implementation and manuscript.", sourceUrls: ["https://example.org/prior-work"] }],
      relatedWork: [{ title: "Prior Work", authors: ["B. Author"], year: 2024, url: "https://example.org/prior-work", relevance: "Uses a closely related method.", relationship: "overlaps" }],
      sources: [{ title: "Prior Work", url: "https://example.org/prior-work", role: "prior-work" }],
      verdict: "revisions-needed",
      limitations: ["No dataset artifact was supplied."],
    };

    const receipt = buildManuscriptReceipt(review);
    expect(receipt).toContain("90% confidence");
    expect(receipt).toContain("Prior Work");
    expect(receipt).toContain("No dataset artifact was supplied");
  });
});
