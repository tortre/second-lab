"use client";

import {
  BookOpen,
  Bot,
  Braces,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  FlaskConical,
  GitBranch,
  Globe2,
  Link2,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

type PreparedPayload = {
  kind: "prepared";
  audit: {
    datasetFingerprint: string;
    paperCount: number;
    receiptStatus: string;
    papers: Array<{ paperId: "attention" | "bert"; title: string; sourceUrl: string; reportedMetric: string; findingCount: number; status: "needs review" | "consistent" }>;
    findings: Array<{ id: string; paperId: "attention" | "bert"; label: string; status: "pass" | "warning" | "fail"; detail: string }>;
  };
  analysis: {
    auditSummary: string;
    studentExplanation: string;
    correctionTitle: string;
    correctionRationale: string;
    issues: Array<{ paperId: "attention" | "bert"; checkId: string; title: string; severity: "high" | "medium" | "low"; paperAnchor: string; evidence: string; correction: string }>;
    mode: "gpt-5.6" | "demo-fallback" | "fallback-after-error";
  };
  receipt: string;
};

type ManuscriptPayload = {
  kind: "manuscript";
  review: {
    mode: "gpt-5.6-files-web";
    manuscript: { title: string; authors: string[]; researchArea: string; centralClaims: string[]; claimedContributions: string[] };
    reviewSummary: string;
    researchTrace: Array<{ stage: "manuscript" | "code" | "literature" | "methods" | "evaluation" | "synthesis"; detail: string }>;
    checks: Array<{ label: string; rationale: string; status: "passed" | "review" | "unverified" }>;
    findings: Array<{ title: string; category: string; severity: "high" | "medium" | "low"; confidence: number; evidence: string; manuscriptAnchor: string; codeAnchor: string; literatureContext: string; correction: string; sourceUrls: string[] }>;
    relatedWork: Array<{ title: string; authors: string[]; year: number; url: string; relevance: string; relationship: "supports" | "overlaps" | "contradicts" | "method-precedent" | "evaluation-precedent" }>;
    sources: Array<{ title: string; url: string; role: "prior-work" | "dataset" | "benchmark" | "method" | "evaluation" | "documentation" }>;
    verdict: "ready" | "revisions-needed" | "major-review" | "insufficient-evidence";
    limitations: string[];
  };
  receipt: string;
};

type ReviewPayload = PreparedPayload | ManuscriptPayload;
type RunState = "ready" | "running" | "review" | "receipt";
type ReviewMode = "manuscript" | "prepared";

const attentionCode = `def scaled_dot_product_attention(query, key, value):
    d_model = query.shape[-1]
    scores = query @ key.transpose(-2, -1) / math.sqrt(d_model)
    return scores.softmax(dim=-1) @ value`;

const bertCode = `def prepare_mlm(tokens):
    mask_rate = 0.20
    selected = sample_positions(tokens, rate=mask_rate)
    if random.random() < 0.80:
        tokens[position] = "[MASK]"`;

function ArtifactCard({ icon, name, meta, href, active = false }: { icon: React.ReactNode; name: string; meta: string; href: string; active?: boolean }) {
  return <a className={`artifact-card ${active ? "artifact-card-active" : ""}`} href={href} download><span className="artifact-icon">{icon}</span><span><strong>{name}</strong><small>{meta}</small></span>{active ? <Check size={14} /> : <ChevronRight size={14} />}</a>;
}

function CheckRow({ label, detail, status }: { label: string; detail: string; status: "pass" | "warning" | "fail" }) {
  const Icon = status === "fail" ? CircleAlert : CircleCheck;
  return <div className={`check-row check-${status}`}><Icon size={17} /><span><strong>{label}</strong><small>{detail}</small></span><b>{status === "fail" ? "Review" : "Passed"}</b></div>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function SecondLabWorkspace() {
  const [runState, setRunState] = useState<RunState>("ready");
  const [reviewMode, setReviewMode] = useState<ReviewMode>("manuscript");
  const [auditStage, setAuditStage] = useState("Reading the manuscript");
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [manuscript, setManuscript] = useState<File | null>(null);
  const [codeFiles, setCodeFiles] = useState<File[]>([]);
  const [context, setContext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const issueCount = payload?.kind === "manuscript" ? payload.review.findings.length : payload?.analysis.issues.length;

  async function runAudit() {
    if (reviewMode === "manuscript" && !manuscript) {
      setError("Add your manuscript before starting the review.");
      return;
    }

    setRunState("running");
    setPayload(null);
    setError(null);
    setAuditStage(reviewMode === "manuscript" ? "Reading the manuscript" : "Reading the source package");
    const sourceTimer = window.setTimeout(() => setAuditStage(reviewMode === "manuscript" ? "Inspecting the implementation" : "Comparing paper anchors with implementation"), 650);
    const webTimer = window.setTimeout(() => setAuditStage(reviewMode === "manuscript" ? "Researching prior literature" : "Explaining the evidence"), 1300);
    const synthesisTimer = window.setTimeout(() => setAuditStage("Forming source-grounded checks"), 2200);

    try {
      let response: Response;
      if (reviewMode === "prepared") {
        response = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "prepared" }),
        });
      } else {
        const formData = new FormData();
        formData.append("manuscript", manuscript as File);
        codeFiles.forEach((file) => formData.append("code", file));
        if (context.trim()) formData.append("context", context.trim());
        response = await fetch("/api/audit", { method: "POST", body: formData });
      }

      const result = (await response.json()) as ReviewPayload | { error?: string };
      if (!response.ok || !("kind" in result)) throw new Error("error" in result && result.error ? result.error : "The review service did not return a result.");
      setPayload(result);
      setRunState("review");
    } catch (cause) {
      setRunState("ready");
      setError(cause instanceof Error ? cause.message : "The review could not be completed.");
    } finally {
      window.clearTimeout(sourceTimer);
      window.clearTimeout(webTimer);
      window.clearTimeout(synthesisTimer);
    }
  }

  function resetPackage() {
    setPayload(null);
    setError(null);
    setRunState("ready");
  }

  function chooseMode(mode: ReviewMode) {
    setReviewMode(mode);
    setError(null);
  }

  function addCodeFiles(files: FileList | null) {
    if (!files) return;
    setCodeFiles((current) => {
      const byKey = new Map(current.map((file) => [fileKey(file), file]));
      Array.from(files).forEach((file) => byKey.set(fileKey(file), file));
      return Array.from(byKey.values()).slice(0, 12);
    });
    if (codeInputRef.current) codeInputRef.current.value = "";
  }

  function downloadReceipt() {
    if (!payload) return;
    const file = new Blob([payload.receipt], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = payload.kind === "manuscript" ? "second-lab-manuscript-review.md" : "second-lab-example-review.md";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><span className="brand-mark"><FlaskConical size={18} /></span><span>Second Lab</span><em>pre-submission research review</em></div>
        <div className="topbar-actions"><span className="secure-pill"><ShieldCheck size={14} /> Evidence-grounded</span><button className="icon-button" onClick={resetPackage} aria-label="Reset review" title="Reset review"><RotateCcw size={16} /></button></div>
      </header>

      <div className="workspace-grid">
        <aside className="sidebar">
          <div className="sidebar-label">Review modes</div>
          <button className={`mode-card ${reviewMode === "manuscript" ? "mode-card-active" : ""}`} onClick={() => chooseMode("manuscript")}><span><FileText size={16} /></span><div><strong>Your manuscript</strong><small>Draft + code + literature</small></div>{reviewMode === "manuscript" && <Check size={14} />}</button>
          <button className={`mode-card ${reviewMode === "prepared" ? "mode-card-active" : ""}`} onClick={() => chooseMode("prepared")}><span><BookOpen size={16} /></span><div><strong>Prepared example</strong><small>Two inspectable fixtures</small></div>{reviewMode === "prepared" && <Check size={14} />}</button>

          <div className="sidebar-label sidebar-section">Example artifacts</div>
          <div className="artifact-list">
            <ArtifactCard icon={<FileCode2 size={17} />} name="attention.py" meta="Transformer · 2017" href="/papers/attention-is-all-you-need/implementation.py" active={reviewMode === "prepared"} />
            <ArtifactCard icon={<FileCode2 size={17} />} name="bert.py" meta="BERT · 2019" href="/papers/bert/implementation.py" />
            <ArtifactCard icon={<Braces size={17} />} name="source-notes.md" meta="2 source anchors" href="/papers/source-notes.md" />
          </div>

          <div className="sidebar-label sidebar-section">Agent trail</div>
          <div className="trail">
            <div className={runState === "ready" ? "trail-item" : "trail-item trail-done"}><CircleDashed size={15} /><span>Read manuscript<small>{runState === "ready" ? "Waiting" : "Complete"}</small></span></div>
            <div className={runState === "ready" ? "trail-item" : "trail-item trail-done"}><CircleDashed size={15} /><span>Inspect code<small>{runState === "ready" ? "Waiting" : "Complete"}</small></span></div>
            <div className={runState === "ready" ? "trail-item" : "trail-item trail-done"}><CircleDashed size={15} /><span>Research literature<small>{runState === "ready" ? "Waiting" : "Complete"}</small></span></div>
            <div className={runState === "review" || runState === "receipt" ? "trail-item trail-alert" : "trail-item"}><CircleDashed size={15} /><span>Form checks<small>{issueCount === undefined ? "Waiting" : `${issueCount} findings`}</small></span></div>
          </div>

          <div className="local-note"><ShieldCheck size={16} /><span><strong>Pre-submission review</strong>Temporary API files are deleted after each attempt. Findings remain advisory.</span></div>
        </aside>

        <section className="main-panel">
          {runState === "ready" && (
            <div className="ready-view">
              <div className="eyebrow"><span className="pulse-dot" /> {reviewMode === "manuscript" ? "New manuscript review" : "Prepared example ready"}</div>
              <div className="claim-card">
                <span className="claim-kicker">Research workspace</span>
                <h1>{reviewMode === "manuscript" ? <>Review your draft before <mark>peer review does.</mark></> : <>Inspect a complete review on <mark>prepared examples.</mark></>}</h1>
                <div className="claim-source">{reviewMode === "manuscript" ? <><Bot size={15} /> Manuscript + implementation + prior literature</> : <><BookOpen size={15} /> Attention Is All You Need + BERT <span>·</span> local evidence</>}</div>
              </div>

              {reviewMode === "manuscript" ? (
                <div className="source-form">
                  <div className="upload-grid">
                    <label className={`upload-drop ${manuscript ? "upload-drop-filled" : ""}`}>
                      <input type="file" accept=".pdf,.docx,.md,.txt" onChange={(event) => setManuscript(event.target.files?.[0] ?? null)} />
                      <span className="upload-icon"><FileText size={18} /></span>
                      <span><strong>{manuscript ? manuscript.name : "Add manuscript"}</strong><small>{manuscript ? formatBytes(manuscript.size) : "PDF, DOCX, Markdown, or text · 8 MB max"}</small></span>
                      <Upload size={15} />
                    </label>
                    <label className="upload-drop">
                      <input ref={codeInputRef} type="file" multiple accept=".py,.ipynb,.r,.js,.jsx,.ts,.tsx,.java,.c,.cc,.cpp,.h,.hpp,.go,.rs,.m,.rb,.sql,.sh,.json,.yaml,.yml,.toml,.csv,.md,.txt" onChange={(event) => addCodeFiles(event.target.files)} />
                      <span className="upload-icon"><FileCode2 size={18} /></span>
                      <span><strong>Add code files</strong><small>Up to 12 source or configuration files</small></span>
                      <Upload size={15} />
                    </label>
                  </div>
                  {codeFiles.length > 0 && <div className="file-list">{codeFiles.map((file) => <span key={fileKey(file)}><FileCode2 size={12} /><b>{file.name}</b><small>{formatBytes(file.size)}</small><button onClick={() => setCodeFiles((current) => current.filter((candidate) => fileKey(candidate) !== fileKey(file)))} aria-label={`Remove ${file.name}`}><X size={12} /></button></span>)}</div>}
                  <label><span><Braces size={14} /> Research context <b>optional</b></span><textarea value={context} onChange={(event) => setContext(event.target.value)} placeholder="Research area, target venue, dataset, central claim, or concern to prioritize" rows={2} /></label>
                  <div className="agent-capabilities"><span><BookOpen size={13} /> Claim review</span><span><FileCode2 size={13} /> Code parity</span><span><Search size={13} /> Related work</span><span><GitBranch size={13} /> Methods + evaluation</span></div>
                </div>
              ) : (
                <>
                  <div className="paper-preview-grid"><div className="paper-preview-card"><div className="paper-number">01</div><div><strong>Attention Is All You Need</strong><span>Vaswani et al. · 2017 · NeurIPS</span><small>Local implementation fixture</small></div></div><div className="paper-preview-card"><div className="paper-number">02</div><div><strong>BERT</strong><span>Devlin et al. · 2019 · NAACL</span><small>Local implementation fixture</small></div></div></div>
                  <div className="method-preview"><div className="panel-heading"><span>Implementation excerpt</span><small>two local artifacts · source visible</small></div><pre><code>{`${attentionCode}\n\n${bertCode}`}</code></pre></div>
                </>
              )}

              {error && <div className="error-banner"><CircleAlert size={16} />{error}</div>}
              <div className="run-row"><div><strong>{reviewMode === "manuscript" ? "The reviewer forms checks from your work" : "Finite prepared registry"}</strong><span>{reviewMode === "manuscript" ? "Claims · novelty · code · data · metrics · statistics" : "Equations · reported metrics · configuration · data contract"}</span></div><button className="primary-button" onClick={runAudit}><Play size={16} fill="currentColor" /> {reviewMode === "manuscript" ? "Review manuscript" : "Run prepared example"}</button></div>
            </div>
          )}

          {runState === "running" && (
            <div className="running-view" aria-live="polite"><div className="scan-orbit"><FlaskConical size={28} /><span /><span /></div><div className="eyebrow"><Sparkles size={14} /> Research agent working</div><h1>{auditStage}</h1><p>{reviewMode === "manuscript" ? "The reviewer is tracing your claims through the manuscript, implementation, and relevant prior research." : "The reviewer is comparing prepared source anchors with local implementation artifacts."}</p><div className="progress-track"><span /></div><div className="running-facts"><span>{reviewMode === "manuscript" ? "Live literature search" : "2 examples"}</span><span>Specific evidence anchors</span><span>No expected findings supplied</span></div></div>
          )}

          {payload?.kind === "prepared" && (runState === "review" || runState === "receipt") && (
            <div className="results-view">
              <div className="result-header"><div><div className="eyebrow issue-eyebrow"><CircleAlert size={14} /> Review findings returned</div><h1>The implementation needs a closer read.</h1><p>{payload.analysis.studentExplanation}</p></div><div className="model-pill"><Sparkles size={14} />{payload.analysis.mode === "gpt-5.6" ? "Reviewed by GPT-5.6" : "Local evidence fallback"}</div></div>
              <div className="paper-result-grid">{payload.audit.papers.map((paper) => <a className={`paper-result-card ${paper.status === "needs review" ? "paper-result-issue" : ""}`} href={paper.sourceUrl} target="_blank" rel="noreferrer" key={paper.paperId}><div><span>{paper.paperId === "attention" ? "01" : "02"}</span><strong>{paper.title}</strong><small>{paper.reportedMetric}</small></div><b>{paper.findingCount ? `${paper.findingCount} finding${paper.findingCount > 1 ? "s" : ""}` : "Consistent"}<ChevronRight size={14} /></b></a>)}</div>
              <div className="evidence-grid"><div className="overlap-card"><div className="panel-heading"><span>Reviewer explanation</span><b>{payload.analysis.issues.length} findings</b></div><div className="explanation-block"><Sparkles size={18} /><p>{payload.analysis.auditSummary}</p></div><div className="explanation-block explanation-soft"><ShieldCheck size={18} /><p>{payload.analysis.correctionRationale}</p></div></div><div className="checks-card"><div className="panel-heading"><span>Evidence registry</span><small>{payload.audit.findings.length} checks complete</small></div>{payload.audit.findings.map((finding) => <CheckRow key={`${finding.paperId}-${finding.id}`} label={`${finding.paperId === "attention" ? "Transformer" : "BERT"} · ${finding.label}`} detail={finding.detail} status={finding.status} />)}</div></div>
              <div className="issue-list">{payload.analysis.issues.map((issue) => <div className="issue-card" key={`${issue.paperId}-${issue.checkId}`}><div className="issue-card-top"><span className="issue-severity">{issue.severity}</span><strong>{issue.title}</strong><small>{issue.paperAnchor}</small></div><p>{issue.evidence}</p><div><GitBranch size={14} /><span>{issue.correction}</span></div></div>)}</div>
              {runState === "review" ? <ReceiptAction title="Preserve findings for review" detail={payload.analysis.correctionTitle} onPrepare={() => setRunState("receipt")} /> : <ReceiptReady status={payload.audit.receiptStatus} detail="Findings are preserved with source anchors and correction text." onDownload={downloadReceipt} />}
            </div>
          )}

          {payload?.kind === "manuscript" && (runState === "review" || runState === "receipt") && (
            <div className="results-view">
              <div className="result-header"><div><div className="eyebrow"><FileText size={14} /> Manuscript review complete</div><h1>{payload.review.manuscript.title}</h1><p>{payload.review.reviewSummary}</p></div><div className="model-pill"><Sparkles size={14} /> GPT-5.6 + literature search</div></div>
              <div className="agent-verdict"><span>{payload.review.verdict.replaceAll("-", " ")}</span><strong>{payload.review.findings.length} findings · {payload.review.relatedWork.length} related papers</strong><p>{payload.review.manuscript.centralClaims.join(" ")}</p></div>
              <div className="agent-grid">
                <div className="agent-panel"><div className="panel-heading"><span>Review trace</span><small>{payload.review.researchTrace.length} steps</small></div><div className="trace-list">{payload.review.researchTrace.map((step, index) => <div key={`${step.stage}-${index}`}><span>{index + 1}</span><div><strong>{step.stage}</strong><p>{step.detail}</p></div></div>)}</div></div>
                <div className="agent-panel"><div className="panel-heading"><span>Related work</span><small>{payload.review.relatedWork.length} papers</small></div><div className="source-list">{payload.review.relatedWork.map((paper, index) => <a href={paper.url} target="_blank" rel="noreferrer" key={`${paper.url}-${index}`}><span><BookOpen size={13} /></span><div><strong>{paper.title}</strong><small>{paper.year} · {paper.relationship.replaceAll("-", " ")}</small></div><ExternalLink size={12} /></a>)}</div></div>
              </div>
              <div className="issue-list">{payload.review.findings.map((finding, index) => <div className="issue-card" key={`${finding.category}-${index}`}><div className="issue-card-top"><span className="issue-severity">{finding.severity}</span><strong>{finding.title}</strong><small>{Math.round(finding.confidence * 100)}% confidence</small></div><p>{finding.evidence}</p><div className="finding-anchors"><span><FileText size={13} />{finding.manuscriptAnchor}</span><span><FileCode2 size={13} />{finding.codeAnchor}</span><span><Globe2 size={13} />{finding.literatureContext}</span></div><div><GitBranch size={14} /><span>{finding.correction}</span></div></div>)}</div>
              <div className="agent-checks"><div className="panel-heading"><span>Checks formed for this manuscript</span><small>{payload.review.checks.length} checks</small></div>{payload.review.checks.map((check, index) => <div key={`${check.label}-${index}`}><CircleCheck size={15} /><span><strong>{check.label}</strong><small>{check.rationale}</small></span><b>{check.status}</b></div>)}</div>
              <div className="agent-panel sources-panel"><div className="panel-heading"><span>Sources used</span><small>{payload.review.sources.length} cited</small></div><div className="source-list">{payload.review.sources.map((source, index) => <a href={source.url} target="_blank" rel="noreferrer" key={`${source.url}-${index}`}><span><Link2 size={13} /></span><div><strong>{source.title}</strong><small>{source.role.replaceAll("-", " ")}</small></div><ExternalLink size={12} /></a>)}</div></div>
              {runState === "review" ? <ReceiptAction title="Preserve the review trail" detail={`${payload.review.sources.length} sources and ${payload.review.findings.length} findings will be attached.`} onPrepare={() => setRunState("receipt")} /> : <ReceiptReady status={payload.review.verdict.replaceAll("-", " ")} detail={payload.review.limitations.join(" · ")} onDownload={downloadReceipt} />}
            </div>
          )}
        </section>

        <aside className="inspector">
          <div className="inspector-top"><span>Review context</span><b>READ ONLY</b></div>
          <div className="poster-mini"><div className="poster-bar">PRE-SUBMISSION REVIEW</div><h3>Your draft, its code, and the research it builds on.</h3><div className="poster-chart"><span style={{ height: "52%" }} /><span style={{ height: "82%" }} /><span style={{ height: "63%" }} /><span style={{ height: "100%" }} /></div><div className="poster-result"><strong>1</strong><span>evidence chain</span></div></div>
          <div className="metadata-list"><div><span><FileText size={14} /> Input</span><b>Manuscript</b></div><div><span><FileCode2 size={14} /> Code</span><b>Working files</b></div><div><span><Globe2 size={14} /> Research</span><b>Prior literature</b></div><div><span><GitBranch size={14} /> Output</span><b>Cited review</b></div></div>
          <div className="inspector-section"><span className="sidebar-label">Review loop</span><p>Extract claims, inspect the implementation, research related work, test methods and evaluation, then expose uncertainty.</p></div>
          <div className="inspector-section"><span className="sidebar-label">Coverage</span><div className="boundary-note"><CircleAlert size={15} /><p>The review does not execute code or prove novelty. Missing data, environment files, or experiments can remain unverified.</p></div></div>
          {payload?.kind === "prepared" && <div className="fingerprint"><span>PACKAGE FINGERPRINT</span><code>{payload.audit.datasetFingerprint}</code></div>}
        </aside>
      </div>
    </main>
  );
}

function ReceiptAction({ title, detail, onPrepare }: { title: string; detail: string; onPrepare: () => void }) {
  return <div className="correction-bar"><span className="correction-icon"><GitBranch size={20} /></span><div><small>Next action</small><strong>{title}</strong><p>{detail}</p></div><button className="primary-button" onClick={onPrepare}><Check size={16} /> Prepare receipt</button></div>;
}

function ReceiptReady({ status, detail, onDownload }: { status: string; detail: string; onDownload: () => void }) {
  return <div className="receipt-bar"><span className="receipt-check"><Check size={22} /></span><div><small>Review receipt</small><strong>{status}</strong><p>{detail}</p></div><button className="secondary-button" onClick={onDownload}><Download size={16} /> Export receipt</button></div>;
}
