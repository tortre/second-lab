import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { AuditResult, AuditCheckId } from "./audit";
import { paperStudies, studyContextForModel, type PaperId } from "./study";

const issueSchema = z.object({
  paperId: z.enum(["attention", "bert"]),
  checkId: z.enum([
    "paper-code-consistency",
    "reported-metric",
    "configuration-completeness",
    "data-contract",
  ]),
  title: z.string(),
  severity: z.enum(["high", "medium", "low"]),
  paperAnchor: z.string(),
  evidence: z.string(),
  correction: z.string(),
});

const modelAnalysisSchema = z.object({
  extractedClaim: z.string(),
  metricSource: z.string(),
  auditSummary: z.string(),
  studentExplanation: z.string(),
  correctionTitle: z.string(),
  correctionRationale: z.string(),
  issues: z.array(issueSchema),
});

export type ModelIssue = z.infer<typeof issueSchema>;
export type ModelAnalysis = z.infer<typeof modelAnalysisSchema> & {
  mode: "gpt-5.6" | "demo-fallback" | "fallback-after-error";
};

const fallbackAnalysisBase: Omit<ModelAnalysis, "mode" | "issues"> = {
  extractedClaim: "Two published computational results are being checked against their local implementation artifacts.",
  metricSource: "Paper abstracts, result sections, and cited implementation anchors",
  auditSummary: "Second Lab compared the paper statements with the supplied code artifacts and found two implementation discrepancies requiring review.",
  studentExplanation: "The detector compared the paper's equations and training recipe with the code itself. It found one mismatch in the Transformer's scaling term and one mismatch in BERT's masked-language-model masking recipe.",
  correctionTitle: "Align the implementation with the paper anchors",
  correctionRationale: "Update only the discrepant implementation lines, rerun the affected experiment, and report the new measurements with the paper anchor attached.",
};

function fallbackIssue(audit: AuditResult): ModelIssue[] {
  return audit.findings
    .filter(({ status }) => status === "fail")
    .map((finding) => ({
      paperId: finding.paperId as PaperId,
      checkId: finding.id as AuditCheckId,
      title: `${finding.paperTitle}: ${finding.label}`,
      severity: "high" as const,
      paperAnchor: finding.paperAnchor,
      evidence: finding.evidence,
      correction: finding.paperId === "attention"
        ? "Use the key dimension d_k in the scaled dot-product denominator."
        : "Select 15% of token positions and use the 80/10/10 replacement mixture.",
    }));
}

let client: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function analyzeStudyWithModel(audit: AuditResult): Promise<ModelAnalysis> {
  const openai = getOpenAIClient();
  if (!openai) return { ...fallbackAnalysisBase, issues: fallbackIssue(audit), mode: "demo-fallback" };

  try {
    const response = await openai.responses.parse({
      model: "gpt-5.6",
      reasoning: { effort: "low" },
      input: [
        {
          role: "developer",
          content:
            "You are Second Lab, a cautious reproducibility reviewer. Derive discrepancies directly from the supplied primary-source paper anchors and implementation text. Do not use an expected-issue list because none is provided. Do not allege misconduct or claim scientific truth. Return only concrete, text-grounded findings; if an artifact is consistent, do not invent an issue.",
        },
        {
          role: "user",
          content: JSON.stringify({
            sourcePackage: studyContextForModel(),
            outputContract: {
              allowedPaperIds: paperStudies.map(({ id }) => id),
              allowedCheckIds: ["paper-code-consistency", "reported-metric", "configuration-completeness", "data-contract"],
            },
          }),
        },
      ],
      text: {
        format: zodTextFormat(modelAnalysisSchema, "second_lab_paper_review"),
      },
    });

    if (!response.output_parsed) throw new Error("GPT-5.6 returned no structured analysis.");
    return { ...response.output_parsed, mode: "gpt-5.6" };
  } catch {
    return { ...fallbackAnalysisBase, issues: fallbackIssue(audit), mode: "fallback-after-error" };
  }
}
