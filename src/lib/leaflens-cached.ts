import reviewFixture from "./demo/leaflens-review.json";
import projectFixture from "../../public/demo/leaflens-project.json";
import { sha256Hex } from "./evidence";
import { reviewResultSchema, type ReviewResult } from "./review-types";

type FixtureAnchor = (typeof reviewFixture.anchors)[number];

function anchorLocator(anchor: FixtureAnchor) {
  if (anchor.lineStart) return `${anchor.fileName}:${anchor.lineStart}${anchor.lineEnd && anchor.lineEnd !== anchor.lineStart ? `-${anchor.lineEnd}` : ""}`;
  return `${anchor.fileName}:${"section" in anchor && anchor.section ? anchor.section : "model located"}`;
}

export function getCachedLeafLensReview(): ReviewResult {
  const externalSources = reviewFixture.sources.filter(
    (source) => source.kind === "external" && typeof source.url === "string",
  );
  const externalIds = new Set(externalSources.map((source) => source.id));
  const anchorsById = new Map(reviewFixture.anchors.map((anchor) => [anchor.id, anchor]));
  const review = {
    id: reviewFixture.reviewId,
    project: {
      title: reviewFixture.project.title,
      audience: "High-school and undergraduate student researchers",
      centralClaims: reviewFixture.findings.map((finding) => finding.claim),
      files: [reviewFixture.project.manuscriptFile, reviewFixture.project.codeFile],
    },
    summary: reviewFixture.summary.headline,
    verdict: "revise",
    findings: reviewFixture.findings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      category: finding.category,
      severity: finding.severity,
      status: finding.status,
      claim: finding.claim,
      evidenceSummary: finding.evidenceSummary,
      whyItMatters: finding.whyItMatters,
      anchors: finding.anchorIds.flatMap((anchorId) => {
        const anchor = anchorsById.get(anchorId);
        if (!anchor) return [];
        return [{
          kind: anchor.artifactType,
          fileName: anchor.fileName,
          locator: anchorLocator(anchor),
          excerpt: anchor.excerpt,
          lineStart: anchor.lineStart,
          lineEnd: anchor.lineEnd,
          section: "section" in anchor ? anchor.section : undefined,
          verification: anchor.verification,
        }];
      }),
      sourceIds: finding.sourceIds.filter((sourceId) => externalIds.has(sourceId)),
      correction: finding.coach.evidenceBackedCorrection,
      concepts: finding.coach.masteredConcepts,
    })),
    sources: externalSources.map((source) => ({
      id: source.id,
      title: source.title,
      url: source.url!,
      role: source.id.includes("accuracy") || source.id.includes("f1") || source.id.includes("evaluation")
        ? "evaluation"
        : source.id.includes("group") || source.id.includes("leakage") || source.id.includes("randomness")
          ? "method"
          : "documentation",
      verification: "cached-fixture",
    })),
    checks: reviewFixture.findings.map((finding) => ({
      label: finding.title,
      status: finding.status,
      detail: finding.evidenceSummary,
    })),
    limitations: [
      reviewFixture.provenance.disclosure,
      "The prepared project is synthetic and its external links were curated into the fixture.",
    ],
    provenance: {
      resolvedModel: "not-run-cached-fixture",
      responseId: "cached-leaflens-2026-07-14-v1",
      promptVersion: reviewFixture.provenance.promptVersion,
      schemaVersion: reviewFixture.schemaVersion,
      inputHashes: [
        { fileName: projectFixture.manuscript.fileName, sha256: sha256Hex(projectFixture.manuscript.content) },
        { fileName: projectFixture.code.fileName, sha256: sha256Hex(projectFixture.code.content) },
      ],
      timestamp: projectFixture.preparedAt,
      usage: { inputTokens: null, outputTokens: null, totalTokens: null },
      latencyMs: 0,
      executionMode: "cached-demo",
      cleanup: { status: "not-applicable", deletedFileIds: [], failedFileIds: [] },
    },
  };
  return reviewResultSchema.parse(review);
}
