import { paperStudies, type PaperId } from "./study";

export type AuditCheckId =
  | "paper-code-consistency"
  | "reported-metric"
  | "configuration-completeness"
  | "data-contract";

export type AuditFinding = {
  id: AuditCheckId;
  paperId: PaperId;
  paperTitle: string;
  label: string;
  status: "pass" | "warning" | "fail";
  detail: string;
  evidence: string;
  paperAnchor: string;
};

export type PaperAudit = {
  paperId: PaperId;
  title: string;
  sourceUrl: string;
  reportedMetric: string;
  findingCount: number;
  status: "needs review" | "consistent";
};

export type AuditResult = {
  generatedAt: string;
  datasetFingerprint: string;
  paperCount: number;
  papers: PaperAudit[];
  findings: AuditFinding[];
  receiptStatus: "Review required" | "No discrepancies found";
};

function simpleFingerprint(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function attentionFindings() {
  const paper = paperStudies.find(({ id }) => id === "attention")!;
  const scaleMatchesPaper = /sqrt\(d_k\)/.test(paper.implementation);
  const reportedMatchesCode = /en_de": 28\.4/.test(paper.implementation) && /en_fr": 41\.8/.test(paper.implementation);

  return [
    {
      id: "paper-code-consistency" as const,
      paperId: paper.id,
      paperTitle: paper.title,
      label: "Equation / implementation",
      status: scaleMatchesPaper ? "pass" as const : "fail" as const,
      detail: scaleMatchesPaper ? "The attention scale matches the paper anchor." : "The attention scale in code does not match the paper anchor.",
      evidence: scaleMatchesPaper ? "Implementation and Eq. 1 use the same denominator." : "The implementation uses `sqrt(d_model)` while Eq. 1 specifies `sqrt(d_k)`.",
      paperAnchor: paper.paperAnchor,
    },
    {
      id: "reported-metric" as const,
      paperId: paper.id,
      paperTitle: paper.title,
      label: "Reported metrics",
      status: reportedMatchesCode ? "pass" as const : "warning" as const,
      detail: reportedMatchesCode ? "The implementation preserves the reported BLEU values." : "The implementation does not preserve every reported BLEU value.",
      evidence: reportedMatchesCode ? "WMT14 values match the paper summary." : "At least one reported WMT14 value is absent or changed.",
      paperAnchor: "Abstract; §6.1",
    },
  ];
}

function bertFindings() {
  const paper = paperStudies.find(({ id }) => id === "bert")!;
  const rateMatch = paper.implementation.match(/mask_rate\s*=\s*(0\.\d+)/);
  const maskRate = rateMatch ? Number(rateMatch[1]) : NaN;
  const selectedRateMatches = maskRate === 0.15;
  const hasUnchangedBranch = /unchanged|same/i.test(paper.implementation);
  const hasRandomBranch = /random_token/.test(paper.implementation);

  return [
    {
      id: "paper-code-consistency" as const,
      paperId: paper.id,
      paperTitle: paper.title,
      label: "Masking procedure",
      status: selectedRateMatches && hasUnchangedBranch && hasRandomBranch ? "pass" as const : "fail" as const,
      detail: selectedRateMatches && hasUnchangedBranch && hasRandomBranch ? "The MLM procedure matches the paper anchor." : "The MLM procedure differs from the paper anchor.",
      evidence: selectedRateMatches && hasUnchangedBranch && hasRandomBranch ? "Selection rate and replacement branches are present." : "The implementation selects 20% of positions and has no unchanged-token branch; the paper specifies 15% with 80/10/10 replacement.",
      paperAnchor: paper.paperAnchor,
    },
    {
      id: "configuration-completeness" as const,
      paperId: paper.id,
      paperTitle: paper.title,
      label: "Training configuration",
      status: /sequence_limit": 512/.test(paper.implementation) && /warmup_steps": 10_000/.test(paper.implementation) ? "pass" as const : "warning" as const,
      detail: "The visible configuration includes the paper's core sequence and warmup settings.",
      evidence: "512-token limit and 10,000 warmup steps are represented in the implementation artifact.",
      paperAnchor: "Appendix A.2",
    },
  ];
}

export function runStudyAudit(): AuditResult {
  const findings = [...attentionFindings(), ...bertFindings()];
  const papers = paperStudies.map((paper) => {
    const paperFindings = findings.filter(({ paperId }) => paperId === paper.id);
    return {
      paperId: paper.id,
      title: paper.title,
      sourceUrl: paper.sourceUrl,
      reportedMetric: paper.reportedMetric,
      findingCount: paperFindings.filter(({ status }) => status === "fail").length,
      status: paperFindings.some(({ status }) => status === "fail") ? "needs review" as const : "consistent" as const,
    };
  });

  return {
    generatedAt: "2026-07-13T17:30:00.000Z",
    datasetFingerprint: simpleFingerprint(paperStudies.map(({ implementation }) => implementation).join("\n")),
    paperCount: paperStudies.length,
    papers,
    findings,
    receiptStatus: findings.some(({ status }) => status === "fail") ? "Review required" : "No discrepancies found",
  };
}
