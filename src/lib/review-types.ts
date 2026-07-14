import { z } from "zod";

export const REVIEW_SCHEMA_VERSION = "2026-07-14.1";
export const REVIEW_PROMPT_VERSION = "student-methods-v1";
export const COACH_PROMPT_VERSION = "defend-revise-v1";

export const executionModeSchema = z.enum([
  "multi-agent",
  "single-agent-fallback",
  "cached-demo",
]);

export const evidenceSourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url().refine((value) => value.startsWith("https://"), "Sources must use HTTPS."),
  role: z.enum([
    "prior-work",
    "dataset",
    "benchmark",
    "method",
    "evaluation",
    "documentation",
  ]),
  verification: z.enum(["native-web", "cached-fixture"]),
});

export const verifiedAnchorObjectSchema = z.object({
  kind: z.enum(["manuscript", "code"]),
  fileName: z.string().min(1),
  locator: z.string().min(1),
  excerpt: z.string().min(1),
  lineStart: z.number().int().positive().optional(),
  lineEnd: z.number().int().positive().optional(),
  page: z.number().int().positive().optional(),
  section: z.string().min(1).optional(),
  verification: z.enum(["verified", "model-located"]),
});

function validateAnchorLocation(anchor: z.infer<typeof verifiedAnchorObjectSchema>, context: z.RefinementCtx) {
  const hasStart = anchor.lineStart !== undefined;
  const hasEnd = anchor.lineEnd !== undefined;
  if (hasStart !== hasEnd) {
    context.addIssue({ code: "custom", path: ["lineStart"], message: "Line anchors require both a start and end." });
  }
  if (hasStart && hasEnd && anchor.lineEnd! < anchor.lineStart!) {
    context.addIssue({ code: "custom", path: ["lineEnd"], message: "Line end must be at or after line start." });
  }
  if (!hasStart && anchor.page === undefined && !anchor.section) {
    context.addIssue({ code: "custom", path: ["locator"], message: "Use a line span, page, or section anchor." });
  }
}

export const verifiedAnchorSchema = verifiedAnchorObjectSchema.superRefine(validateAnchorLocation);

export const findingCategorySchema = z.enum([
  "metric-mismatch",
  "data-leakage",
  "unsupported-baseline",
  "reproducibility",
  "literature-context",
  "methods-evaluation",
  "claim-code-consistency",
  "missing-evidence",
]);

export const evidenceFindingObjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: findingCategorySchema,
  severity: z.enum(["high", "medium", "low"]),
  status: z.enum(["confirmed", "concern", "unverified"]),
  claim: z.string().min(1),
  evidenceSummary: z.string().min(1),
  whyItMatters: z.string().min(1),
  anchors: z.array(verifiedAnchorSchema).min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
  correction: z.string().min(1),
  concepts: z.array(z.string().min(1)).min(1),
});

function validateFindingAnchors(finding: z.infer<typeof evidenceFindingObjectSchema>, context: z.RefinementCtx) {
  for (const kind of ["manuscript", "code"] as const) {
    if (!finding.anchors.some((anchor) => anchor.kind === kind)) {
      context.addIssue({ code: "custom", path: ["anchors"], message: `Every finding requires a ${kind} anchor.` });
    }
  }
}

export const evidenceFindingSchema = evidenceFindingObjectSchema.superRefine(validateFindingAnchors);

export const usageSchema = z.object({
  inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(),
  totalTokens: z.number().int().nonnegative().nullable(),
});

export const cleanupSchema = z.object({
  status: z.enum(["complete", "partial", "not-applicable"]),
  deletedFileIds: z.array(z.string()),
  failedFileIds: z.array(z.string()),
});

export const reviewProvenanceSchema = z.object({
  resolvedModel: z.string().min(1),
  responseId: z.string().min(1),
  promptVersion: z.string().min(1),
  schemaVersion: z.string().min(1),
  inputHashes: z.array(z.object({ fileName: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/) })),
  timestamp: z.string().datetime(),
  usage: usageSchema,
  latencyMs: z.number().int().nonnegative(),
  executionMode: executionModeSchema,
  cleanup: cleanupSchema,
});

export const reviewResultSchema = z.object({
  id: z.string().min(1),
  project: z.object({
    title: z.string().min(1),
    audience: z.string().min(1),
    centralClaims: z.array(z.string().min(1)),
    files: z.array(z.string().min(1)),
  }),
  summary: z.string().min(1),
  verdict: z.enum(["ready", "revise", "insufficient-evidence"]),
  findings: z.array(evidenceFindingSchema),
  sources: z.array(evidenceSourceSchema),
  checks: z.array(z.object({
    label: z.string().min(1),
    status: z.enum(["confirmed", "concern", "unverified"]),
    detail: z.string().min(1),
  })),
  limitations: z.array(z.string().min(1)),
  provenance: reviewProvenanceSchema,
});

export const coachAttemptSchema = z.object({
  attemptNumber: z.number().int().min(1).max(2),
  diagnosis: z.string().min(1).max(2400),
  revisionPlan: z.string().min(1).max(2400),
  status: z.enum(["not-yet", "developing", "mastered"]),
  feedback: z.string().min(1),
  nextHint: z.string().min(1).nullable().optional(),
  masteredConcepts: z.array(z.string().min(1)),
  submittedAt: z.string().datetime(),
});

export const coachResultSchema = z.object({
  status: z.enum(["not-yet", "developing", "mastered"]),
  feedback: z.string().min(1),
  nextHint: z.string().min(1).nullable(),
  masteredConcepts: z.array(z.string().min(1)),
  executionMode: executionModeSchema,
});

export const learningReceiptSchema = z.object({
  reviewId: z.string().min(1),
  projectTitle: z.string().min(1),
  exportedAt: z.string().datetime(),
  attempts: z.array(z.object({
    findingId: z.string().min(1),
    findingTitle: z.string().min(1),
    attempts: z.array(coachAttemptSchema),
    finalExplanation: z.string(),
    revisionPlan: z.string(),
  })),
  sources: z.array(evidenceSourceSchema),
  masteredConcepts: z.array(z.string().min(1)),
  unresolvedConcerns: z.array(z.string().min(1)),
  provenance: reviewProvenanceSchema,
});

export type ExecutionMode = z.infer<typeof executionModeSchema>;
export type EvidenceSource = z.infer<typeof evidenceSourceSchema>;
export type VerifiedAnchor = z.infer<typeof verifiedAnchorSchema>;
export type EvidenceFinding = z.infer<typeof evidenceFindingSchema>;
export type ReviewProvenance = z.infer<typeof reviewProvenanceSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;
export type CoachAttempt = z.infer<typeof coachAttemptSchema>;
export type CoachResult = z.infer<typeof coachResultSchema>;
export type LearningReceipt = z.infer<typeof learningReceiptSchema>;

export type ReviewStreamEvent =
  | { event: "review.started"; reviewId: string; requestedMode: "prepared" | "upload" }
  | { event: "review.mode"; mode: ExecutionMode; detail: string }
  | { event: "agent.started"; agent: string; role: string }
  | { event: "source.found"; agent: string; source: EvidenceSource }
  | { event: "agent.completed"; agent: string; detail: string }
  | { event: "review.completed"; review: ReviewResult }
  | { event: "review.failed"; code: string; message: string; cachedDemoUrl?: string };
