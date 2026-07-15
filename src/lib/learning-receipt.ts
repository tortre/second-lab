import { escapeMarkdown, httpsMarkdownUrl } from "./markdown";
import { learningReceiptSchema, type CoachAttempt, type LearningReceipt, type ReviewResult } from "./review-types";

export type AttemptsByFinding = Record<string, CoachAttempt[]>;

export function createLearningReceipt(review: ReviewResult, attemptsByFinding: AttemptsByFinding): LearningReceipt {
  const attempts = review.findings
    .filter((finding) => (attemptsByFinding[finding.id]?.length ?? 0) > 0)
    .map((finding) => {
      const findingAttempts = attemptsByFinding[finding.id] ?? [];
      const finalAttempt = findingAttempts.at(-1);
      return {
        findingId: finding.id,
        findingTitle: finding.title,
        attempts: findingAttempts,
        finalExplanation: finalAttempt?.diagnosis ?? "",
        revisionPlan: finalAttempt?.revisionPlan ?? "",
      };
    });
  const masteredIds = new Set(attempts.filter((item) => item.attempts.at(-1)?.status === "mastered").map((item) => item.findingId));
  const masteredConcepts = [...new Set(attempts
    .filter((item) => masteredIds.has(item.findingId))
    .flatMap((item) => item.attempts.at(-1)?.masteredConcepts ?? []))];
  const unresolvedConcerns = review.findings.filter((finding) => !masteredIds.has(finding.id)).map((finding) => finding.title);
  return learningReceiptSchema.parse({
    reviewId: review.id,
    projectTitle: review.project.title,
    exportedAt: new Date().toISOString(),
    attempts,
    sources: review.sources,
    masteredConcepts,
    unresolvedConcerns,
    provenance: review.provenance,
  });
}

export function learningReceiptMarkdown(receipt: LearningReceipt) {
  const title = receipt.unresolvedConcerns.length === 0
    ? "Second Lab mastery receipt"
    : "Second Lab learning receipt";
  const attempts = receipt.attempts.map((entry) => {
    const history = entry.attempts.map((attempt) =>
      `  - Attempt ${attempt.attemptNumber}: **${attempt.status}** — ${escapeMarkdown(attempt.feedback)}`,
    ).join("\n");
    return `- **${escapeMarkdown(entry.findingTitle)}**\n${history}\n  - Final explanation: ${escapeMarkdown(entry.finalExplanation)}\n  - Revision plan: ${escapeMarkdown(entry.revisionPlan)}`;
  }).join("\n");
  const sources = receipt.sources.map((source) =>
    `- [${escapeMarkdown(source.title)}](${httpsMarkdownUrl(source.url)}) — ${source.role}; ${source.verification}`,
  ).join("\n");
  const hashes = receipt.provenance.inputHashes.map((hash) =>
    `- ${escapeMarkdown(hash.fileName)}: \`${hash.sha256}\``,
  ).join("\n");

  return `# ${title}

## Project

**${escapeMarkdown(receipt.projectTitle)}**

## Defend and revise attempts

${attempts || "No coaching attempts were recorded."}

## Mastered concepts

${receipt.masteredConcepts.map((item) => `- ${escapeMarkdown(item)}`).join("\n") || "- None yet"}

## Unresolved concerns

${receipt.unresolvedConcerns.map((item) => `- ${escapeMarkdown(item)}`).join("\n") || "- None"}

## Sources

${sources || "- No external sources were displayed."}

## Provenance

- Review ID: \`${escapeMarkdown(receipt.reviewId)}\`
- Execution mode: \`${receipt.provenance.executionMode}\`
- Resolved model: \`${escapeMarkdown(receipt.provenance.resolvedModel)}\`
- OpenAI response ID: \`${escapeMarkdown(receipt.provenance.responseId)}\`
- Prompt version: \`${escapeMarkdown(receipt.provenance.promptVersion)}\`
- Schema version: \`${escapeMarkdown(receipt.provenance.schemaVersion)}\`
- Timestamp: ${receipt.provenance.timestamp}
- Latency: ${receipt.provenance.latencyMs} ms
- Usage: ${receipt.provenance.usage.inputTokens ?? "unknown"} input / ${receipt.provenance.usage.outputTokens ?? "unknown"} output / ${receipt.provenance.usage.totalTokens ?? "unknown"} total tokens
- Cleanup: ${receipt.provenance.cleanup.status}; ${receipt.provenance.cleanup.failedFileIds.length} deletion failures

### SHA-256 input hashes

${hashes || "- No uploaded inputs; cached fixture."}

---

Exported ${receipt.exportedAt}. This receipt is a mentor handoff, not a truth certificate or peer review.
`;
}
