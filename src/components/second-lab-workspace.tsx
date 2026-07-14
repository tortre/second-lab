"use client";

import { MessageResponse } from "@/components/ai-elements/message";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { createLearningReceipt, learningReceiptMarkdown, type AttemptsByFinding } from "@/lib/learning-receipt";
import { readReviewStream } from "@/lib/ndjson";
import {
  coachResultSchema,
  type CoachAttempt,
  type EvidenceFinding,
  type EvidenceSource,
  type ReviewResult,
  type ReviewStreamEvent,
} from "@/lib/review-types";
import {
  ArrowRight,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDot,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  FlaskConical,
  Globe2,
  GraduationCap,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  Search,
  Sparkles,
  Square,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Screen = "landing" | "running" | "results";
type EntryMode = "prepared" | "upload";
type Health = { liveReview: boolean; multiAgent: boolean; accessRequired: boolean };
type Draft = { diagnosis: string; revisionPlan: string };

const emptyDraft: Draft = { diagnosis: "", revisionPlan: "" };
const manuscriptExtensions = new Set(["pdf", "docx", "md", "txt"]);
const codeExtensions = new Set(["py", "ipynb", "r", "js", "jsx", "ts", "tsx", "java", "c", "cc", "cpp", "h", "hpp", "go", "rs", "m", "rb", "sql", "sh", "json", "yaml", "yml", "toml", "csv", "md", "txt"]);
const projectFileTypes = ".pdf,.docx,.md,.txt,.py,.ipynb,.r,.js,.jsx,.ts,.tsx,.java,.c,.cc,.cpp,.h,.hpp,.go,.rs,.m,.rb,.sql,.sh,.json,.yaml,.yml,.toml,.csv";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function fileExtension(file: File) {
  return file.name.split(".").at(-1)?.toLowerCase() ?? "";
}

function displayAgent(agent: string) {
  return agent.split("/").filter(Boolean).at(-1)?.replaceAll("_", " ") ?? "reviewer";
}

function statusLabel(status: EvidenceFinding["status"] | CoachAttempt["status"]) {
  return status.replace("not-yet", "not yet");
}

function ModelCopy({ children, links = [] }: { children: string; links?: string[] }) {
  return (
    <MessageResponse
      className="model-copy"
      urlTransform={(url) => links.includes(url) ? url : null}
    >
      {children}
    </MessageResponse>
  );
}

function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function SecondLabWorkspace() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [entryMode, setEntryMode] = useState<EntryMode>("prepared");
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [events, setEvents] = useState<ReviewStreamEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cachedDemoUrl, setCachedDemoUrl] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [manuscript, setManuscript] = useState<File | null>(null);
  const [codeFiles, setCodeFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [attempts, setAttempts] = useState<AttemptsByFinding>({});
  const [coachBusy, setCoachBusy] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const autoStarted = useRef(false);

  useEffect(() => {
    fetch("/api/health", { cache: "no-store" })
      .then((response) => response.json())
      .then((value: Health) => setHealth(value))
      .catch(() => setHealth({ liveReview: false, multiAgent: false, accessRequired: false }));
  }, []);

  useEffect(() => {
    if (autoStarted.current || typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("demo") === "leaflens") {
      autoStarted.current = true;
      document.getElementById("try-student-study")?.click();
    }
  }, []);

  const selectedFinding = review?.findings.find((finding) => finding.id === selectedFindingId) ?? review?.findings[0] ?? null;
  const sourceMap = useMemo(() => new Map(review?.sources.map((source) => [source.id, source]) ?? []), [review]);
  const sourceLinks = review?.sources.map((source) => source.url) ?? [];
  const masteryCount = review?.findings.filter((finding) => attempts[finding.id]?.at(-1)?.status === "mastered").length ?? 0;

  function reset() {
    abortRef.current?.abort();
    setScreen("landing");
    setEntryMode("prepared");
    setReview(null);
    setEvents([]);
    setError(null);
    setCachedDemoUrl(null);
    setManuscript(null);
    setCodeFiles([]);
    setDragging(false);
    setAccessCode("");
    setAttempts({});
    setDrafts({});
    setRevealed(new Set());
    setSelectedFindingId(null);
  }

  function addProjectFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    if (incoming.length === 0) return;
    let nextManuscript = manuscript;
    const nextCode = new Map(codeFiles.map((file) => [fileKey(file), file]));
    const rejected: string[] = [];

    for (const file of incoming) {
      const extension = fileExtension(file);
      if (!nextManuscript && manuscriptExtensions.has(extension)) {
        nextManuscript = file;
      } else if (codeExtensions.has(extension)) {
        nextCode.set(fileKey(file), file);
      } else {
        rejected.push(file.name);
      }
    }

    setManuscript(nextManuscript);
    setCodeFiles([...nextCode.values()].slice(0, 12));
    setError(rejected.length > 0 ? `I couldn't use ${rejected.join(", ")}. Add a paper and source-code files.` : null);
    if (projectInputRef.current) projectInputRef.current.value = "";
  }

  async function unlockLiveReview() {
    if (!health?.accessRequired) return;
    if (!accessCode.trim()) throw new Error("Enter the judge access code for live review.");
    const response = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: accessCode.trim() }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) throw new Error(result.error || "The access code was not accepted.");
  }

  async function startReview(mode: EntryMode) {
    if (mode === "upload" && (!manuscript || codeFiles.length === 0)) {
      setEntryMode("upload");
      setError(!manuscript
        ? "Add your paper first."
        : "Add at least one code file.");
      document.getElementById("project-upload")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setEntryMode(mode);
    setScreen("running");
    setReview(null);
    setEvents([]);
    setError(null);
    setCachedDemoUrl(null);
    try {
      const runPreparedLive = mode === "prepared"
        && Boolean(health?.liveReview)
        && (!health?.accessRequired || Boolean(accessCode.trim()));
      if (mode === "upload" || (runPreparedLive && health?.accessRequired)) {
        await unlockLiveReview();
      }
      let response: Response;
      if (mode === "prepared") {
        if (runPreparedLive) {
          const form = new FormData();
          form.append("prepared", "leaflens");
          response = await fetch("/api/review", { method: "POST", body: form, signal: controller.signal });
        } else {
          response = await fetch("/api/review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "prepared" }),
            signal: controller.signal,
          });
        }
      } else {
        const form = new FormData();
        form.append("manuscript", manuscript!);
        codeFiles.forEach((file) => form.append("code", file));
        response = await fetch("/api/review", { method: "POST", body: form, signal: controller.signal });
      }
      let completed: ReviewResult | null = null;
      let failure: Extract<ReviewStreamEvent, { event: "review.failed" }> | null = null;
      await readReviewStream(response, (event) => {
        setEvents((current) => [...current, event]);
        if (event.event === "review.completed") completed = event.review;
        if (event.event === "review.failed") failure = event;
      }, controller.signal);
      if (failure) {
        const failedEvent = failure as Extract<ReviewStreamEvent, { event: "review.failed" }>;
        setCachedDemoUrl(failedEvent.cachedDemoUrl ?? null);
        throw new Error(failedEvent.message);
      }
      if (!completed) throw new Error("The review ended without a result.");
      const finalReview = completed as ReviewResult;
      setReview(finalReview);
      setSelectedFindingId(finalReview.findings[0]?.id ?? null);
      setScreen("results");
    } catch (cause) {
      if (controller.signal.aborted) {
        setError("Review cancelled. No fallback was started.");
      } else {
        setError(cause instanceof Error ? cause.message : "The review could not be completed.");
      }
      setScreen("landing");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  async function submitCoach(finding: EvidenceFinding) {
    if (!review) return;
    const draft = drafts[finding.id] ?? emptyDraft;
    if (draft.diagnosis.trim().length < 8 || draft.revisionPlan.trim().length < 8) {
      setError("Answer both coaching questions before submitting.");
      return;
    }
    setCoachBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finding,
          priorAttempts: attempts[finding.id] ?? [],
          diagnosis: draft.diagnosis,
          revisionPlan: draft.revisionPlan,
          reviewExecutionMode: review.provenance.executionMode,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "The coach could not assess this attempt.");
      const result = coachResultSchema.parse(body);
      const attempt: CoachAttempt = {
        attemptNumber: Math.min(2, (attempts[finding.id]?.length ?? 0) + 1) as 1 | 2,
        diagnosis: draft.diagnosis.trim(),
        revisionPlan: draft.revisionPlan.trim(),
        status: result.status,
        feedback: result.feedback,
        nextHint: result.nextHint,
        masteredConcepts: result.masteredConcepts,
        submittedAt: new Date().toISOString(),
      };
      setAttempts((current) => ({ ...current, [finding.id]: [...(current[finding.id] ?? []), attempt].slice(0, 2) }));
      if (result.status === "mastered") setRevealed((current) => new Set(current).add(finding.id));
      if (result.nextHint) {
        setEvents((current) => [...current, { event: "agent.completed", agent: "/coach", detail: `Hint: ${result.nextHint}` }]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The coach could not assess this attempt.");
    } finally {
      setCoachBusy(false);
    }
  }

  function exportReceipt() {
    if (!review) return;
    const receipt = createLearningReceipt(review, attempts);
    downloadText("second-lab-mastery-receipt.md", learningReceiptMarkdown(receipt));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand-lockup brand-button" onClick={reset} aria-label="Return to Second Lab home">
          <span className="brand-mark"><FlaskConical size={18} /></span>
          <span>Second Lab</span>
        </button>
        <div className="topbar-actions">
          <button className="reset-button" onClick={reset}><RotateCcw size={15} /> Start over</button>
        </div>
      </header>

      <div className="workspace-grid">
        <section className="main-panel">
          {screen === "landing" && (
            <div className="landing-view simple-landing">
              <section className="simple-hero">
                <h1>Check your research.</h1>
                <p>Drop in whatever you have.</p>
              </section>

              <section className="simple-start" id="project-upload">
                <label
                  className={`simple-drop-zone ${dragging ? "dragging" : ""} ${manuscript || codeFiles.length > 0 ? "has-files" : ""}`}
                  onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
                  onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => { event.preventDefault(); setDragging(false); addProjectFiles(event.dataTransfer.files); }}
                >
                  <input ref={projectInputRef} type="file" multiple accept={projectFileTypes} onChange={(event) => event.target.files && addProjectFiles(event.target.files)} />
                  <span className="simple-drop-icon"><Upload size={28} /></span>
                  <strong>{manuscript || codeFiles.length > 0 ? `${Number(Boolean(manuscript)) + codeFiles.length} file${Number(Boolean(manuscript)) + codeFiles.length === 1 ? "" : "s"} added` : "Drop files here"}</strong>
                  <small>{!manuscript ? "Start with your paper" : codeFiles.length === 0 ? "Now add your code" : "Ready to check"}</small>
                  <em>or click to choose files</em>
                </label>

                {(manuscript || codeFiles.length > 0) && <div className="simple-file-list">
                  {manuscript && <span><FileText size={15} /><b>{manuscript.name}</b><small>{formatBytes(manuscript.size)}</small><button onClick={() => setManuscript(null)} aria-label={`Remove ${manuscript.name}`}><X size={14} /></button></span>}
                  {codeFiles.map((file) => <span key={fileKey(file)}><FileCode2 size={15} /><b>{file.name}</b><small>{formatBytes(file.size)}</small><button onClick={() => setCodeFiles((current) => current.filter((item) => fileKey(item) !== fileKey(file)))} aria-label={`Remove ${file.name}`}><X size={14} /></button></span>)}
                </div>}

                {health?.accessRequired && manuscript && codeFiles.length > 0 && <label className="simple-access"><span><LockKeyhole size={15} /> Access code</span><input type="password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} autoComplete="off" /></label>}

                {error && <ErrorBanner message={error} cachedDemoUrl={cachedDemoUrl} />}

                {manuscript && codeFiles.length > 0 && <button className="primary-button simple-review-button" onClick={() => void startReview("upload")}>
                  <Sparkles size={18} /> Check my research
                </button>}
                <button id="try-student-study" className="simple-demo-link" onClick={() => void startReview("prepared")}>
                  No project? Try the demo <ArrowRight size={14} />
                </button>
              </section>
            </div>
          )}

          {screen === "running" && (
            <div className="running-view" aria-live="polite">
              <div className="running-top"><div className="scan-orbit"><FlaskConical size={28} /><span /><span /></div><div><div className="eyebrow"><Sparkles size={14} /> {entryMode === "prepared" ? "Opening the demo" : "Checking your project"}</div><h1>Checking your research</h1><p>This can take a minute. We’ll show you what we find.</p></div></div>
              <div className="live-trail">
                {events.length === 0 && <div className="trail-event"><LoaderCircle className="spin" size={17} /><div><strong>Connecting to reviewer</strong><small>Waiting for the first server event</small></div></div>}
                {events.filter((event) => event.event !== "review.completed").map((event, index) => <StreamEvent key={`${event.event}-${index}`} event={event} />)}
              </div>
              <button className="cancel-button" onClick={() => abortRef.current?.abort()}><Square size={13} fill="currentColor" /> Cancel review</button>
            </div>
          )}

          {screen === "results" && review && (
            <div className="results-view">
              <div className="result-header">
                <div><div className="eyebrow"><CheckCircle2 size={14} /> What we found</div><h1>{review.project.title}</h1><ModelCopy links={sourceLinks}>{review.summary}</ModelCopy></div>
                <span className={`mode-pill ${review.provenance.executionMode === "cached-demo" ? "cached" : "live"}`}>{review.provenance.executionMode}</span>
              </div>

              <div className="result-stats">
                <div><strong>{review.findings.filter((item) => item.status === "confirmed").length}</strong><span>confirmed</span></div>
                <div><strong>{review.findings.filter((item) => item.status === "concern").length}</strong><span>concerns</span></div>
                <div><strong>{review.sources.length}</strong><span>displayed sources</span></div>
                <div><strong>{masteryCount}/{review.findings.length}</strong><span>concepts defended</span></div>
              </div>

              <div className="finding-tabs" aria-label="Review findings">
                {review.findings.map((finding, index) => <button aria-pressed={selectedFinding?.id === finding.id} className={selectedFinding?.id === finding.id ? "finding-tab active" : "finding-tab"} key={finding.id} onClick={() => setSelectedFindingId(finding.id)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{finding.title}</strong><small>{finding.category.replaceAll("-", " ")}</small></div><b className={`status ${finding.status}`}>{finding.status}</b><ChevronRight size={15} /></button>)}
              </div>

              {selectedFinding && (
                <FindingWorkspace
                  finding={selectedFinding}
                  sources={selectedFinding.sourceIds.map((id) => sourceMap.get(id)).filter((source): source is EvidenceSource => Boolean(source))}
                  draft={drafts[selectedFinding.id] ?? emptyDraft}
                  attempts={attempts[selectedFinding.id] ?? []}
                  revealed={revealed.has(selectedFinding.id)}
                  busy={coachBusy}
                  onDraft={(draft) => setDrafts((current) => ({ ...current, [selectedFinding.id]: draft }))}
                  onSubmit={() => void submitCoach(selectedFinding)}
                  onReveal={() => setRevealed((current) => new Set(current).add(selectedFinding.id))}
                />
              )}

              {error && <ErrorBanner message={error} cachedDemoUrl={cachedDemoUrl} />}
              <div className="receipt-bar"><span><GraduationCap size={21} /></span><div><strong>Mastery receipt + mentor handoff</strong><p>Attempts, final explanations, revision plans, citations, mastered concepts, unresolved concerns, hashes, usage, latency, and cleanup.</p></div><button className="secondary-button" disabled={Object.keys(attempts).length === 0} onClick={exportReceipt}><Download size={16} /> Export receipt</button></div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ErrorBanner({ message, cachedDemoUrl }: { message: string; cachedDemoUrl?: string | null }) {
  return <div className="error-banner" role="alert"><CircleAlert size={17} /><span>{message}</span>{cachedDemoUrl && <a href={cachedDemoUrl}>Open the cached LeafLens demo <ArrowRight size={13} /></a>}</div>;
}

function StreamEvent({ event }: { event: ReviewStreamEvent }) {
  if (event.event === "review.started") return <div className="trail-event complete"><CircleDot size={17} /><div><strong>Review opened</strong><small>{event.requestedMode} · {event.reviewId}</small></div></div>;
  if (event.event === "review.mode") return <div className="trail-event complete"><Bot size={17} /><div><strong>{event.mode}</strong><small>{event.detail}</small></div></div>;
  if (event.event === "agent.started") return <div className="trail-event active"><LoaderCircle className="spin" size={17} /><div><strong>{displayAgent(event.agent)}</strong><small>{event.role}</small></div></div>;
  if (event.event === "agent.completed") return <div className="trail-event complete"><CheckCircle2 size={17} /><div><strong>{displayAgent(event.agent)} complete</strong><small>{event.detail}</small></div></div>;
  if (event.event === "source.found") return <div className="trail-event complete"><Globe2 size={17} /><div><strong>Verified source</strong><small>{event.source.title}</small></div></div>;
  if (event.event === "review.failed") return <div className="trail-event failed"><CircleAlert size={17} /><div><strong>Review failed</strong><small>{event.message}</small></div></div>;
  return null;
}

function FindingWorkspace({ finding, sources, draft, attempts, revealed, busy, onDraft, onSubmit, onReveal }: {
  finding: EvidenceFinding;
  sources: EvidenceSource[];
  draft: Draft;
  attempts: CoachAttempt[];
  revealed: boolean;
  busy: boolean;
  onDraft: (draft: Draft) => void;
  onSubmit: () => void;
  onReveal: () => void;
}) {
  const latest = attempts.at(-1);
  const canReveal = latest?.status === "mastered" || attempts.length >= 2;
  const links = sources.map((source) => source.url);
  const coachHint = latest?.status !== "mastered" ? latest?.nextHint : null;
  return (
    <section className="finding-workspace">
      <div className="finding-overview">
        <div className="finding-title-row"><span className={`status ${finding.status}`}>{finding.status}</span><span className={`severity ${finding.severity}`}>{finding.severity}</span><strong>{finding.title}</strong></div>
        <div className="evidence-map">
          <div><span className="map-label"><BookOpen size={14} /> Claim</span><ModelCopy links={links}>{finding.claim}</ModelCopy></div>
          <div><span className="map-label"><Search size={14} /> Evidence</span><ModelCopy links={links}>{finding.evidenceSummary}</ModelCopy></div>
          <div><span className="map-label"><BrainCircuit size={14} /> Why it matters</span><ModelCopy links={links}>{finding.whyItMatters}</ModelCopy></div>
        </div>
        <div className="anchors">
          {finding.anchors.map((anchor, index) => <div className="anchor-card" key={`${anchor.fileName}-${anchor.locator}-${index}`}><div><span>{anchor.kind === "code" ? <FileCode2 size={14} /> : <FileText size={14} />}{anchor.locator}</span><b className={anchor.verification === "verified" ? "verified" : "located"}>{anchor.verification}</b></div><pre><code>{anchor.excerpt}</code></pre></div>)}
        </div>
        <Sources className="finding-sources" defaultOpen>
          <SourcesTrigger count={sources.length} />
          <SourcesContent>{sources.map((source) => <Source className="citation-link" href={source.url} title={source.title} key={source.id}><Globe2 size={14} /><span>{source.title}</span><small>{source.verification}</small><ExternalLink size={12} /></Source>)}</SourcesContent>
        </Sources>
      </div>

      <div className="coach-panel">
        <div className="coach-heading"><span><GraduationCap size={18} /></span><div><strong>Defend, then revise</strong><p>The direct correction is hidden. Explain the methodological consequence first.</p></div><b>{attempts.length}/2 attempts</b></div>
        <label><span>Why does this matter?</span><textarea rows={3} value={draft.diagnosis} onChange={(event) => onDraft({ ...draft, diagnosis: event.target.value })} placeholder="Connect the cited mismatch to the validity of the claim…" disabled={latest?.status === "mastered"} /></label>
        <label><span>What would you revise?</span><textarea rows={3} value={draft.revisionPlan} onChange={(event) => onDraft({ ...draft, revisionPlan: event.target.value })} placeholder="Propose a concrete change and how you would verify it…" disabled={latest?.status === "mastered"} /></label>
        {latest && <div className={`coach-feedback ${latest.status}`}><div><Lightbulb size={17} /><strong>{statusLabel(latest.status)}</strong></div><ModelCopy links={links}>{latest.feedback}</ModelCopy>{coachHint && <p className="hint"><Lightbulb size={14} /> Hint: {coachHint}</p>}</div>}
        <div className="coach-actions">
          {!canReveal && <button className="primary-button" onClick={onSubmit} disabled={busy || attempts.length >= 2}>{busy ? <LoaderCircle className="spin" size={16} /> : <ArrowRight size={16} />} {attempts.length ? "Try again" : "Assess my reasoning"}</button>}
          {canReveal && !revealed && <button className="secondary-button" onClick={onReveal}><Lightbulb size={16} /> Reveal evidence-backed correction</button>}
        </div>
        <div className={revealed ? "correction revealed" : "correction locked"}>
          <span>{revealed ? <CheckCircle2 size={17} /> : <LockKeyhole size={17} />}</span>
          <div><strong>{revealed ? "Evidence-backed correction" : "Correction stays hidden"}</strong>{revealed ? <ModelCopy links={links}>{finding.correction}</ModelCopy> : <p>Master the concept or make two serious attempts to unlock it.</p>}</div>
        </div>
      </div>
    </section>
  );
}
