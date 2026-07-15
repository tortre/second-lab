# Second Lab

Second Lab is an AI research-methods coach for high-school and undergraduate researchers.

It does **not** write a student's paper. It asks the student to defend each important claim with manuscript evidence, code evidence, methodology, and literature, then coaches the student through a defend-and-revise loop.

Public demo: [second-lab.vercel.app](https://second-lab.vercel.app). The cached LeafLens judge path is ready; live GPT-5.6 review remains disabled until production secrets are configured. The latest drop-or-demo interface is local-only until the project owner approves another deployment.

## The judge path: LeafLens

Choose **No project? Try the demo** to review LeafLens, a synthetic leaf-species classification project with three intentionally seeded defects:

- the paper reports macro-F1 while the code calculates accuracy;
- augmented copies are created before the train/test split, allowing related images into both sets;
- the paper claims superiority over baselines, but no baseline comparison is implemented.

A clean corrected LeafLens variant is included as a negative control for evaluation. No real student's work appears in the prepared demo.

The demo never disguises its mode. When live review is available and access is required, it shows separate **Run live demo** and **Use instant demo** actions. With valid judge access, the bundled LeafLens paper and code use the real specialist pipeline; otherwise the one-click public path uses the deterministic result and displays `cached-demo`.

For each finding, Second Lab maps a claim to the exact manuscript excerpt, exact code excerpt, stable file-line or section anchor, and supporting sources. It reports `confirmed`, `concern`, or `unverified`; it does not display invented confidence percentages.

## Learning loop

The correction is hidden at first. For each finding, the student answers:

1. **Why does this matter?**
2. **What would you revise?**

GPT-5.6 assesses the diagnosis and revision plan as `not-yet`, `developing`, or `mastered`. When the answer is incomplete, the coach gives one progressive hint. After two unsuccessful attempts, the student may reveal the evidence-backed correction. The downloadable learning receipt doubles as a mentor handoff and includes attempts, the final explanation, the revision plan, sources, mastered concepts, unresolved concerns, and review provenance. It is labeled a mastery receipt only after every finding is mastered.

When an API key is configured, this coaching assessment uses GPT-5.6 even on the prepared study. Without a key, the public demo uses a deterministic, honestly local fallback so the learning loop remains testable offline.

## Run locally

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The cached LeafLens demo works without an API key. Live review and GPT assessment require `OPENAI_API_KEY`.

Environment variables are documented in [.env.example](.env.example). Never commit `.env.local`.

## Review modes

Second Lab labels every review with its actual execution mode:

- `multi-agent` — GPT-5.6 Multi-agent beta runs three specialists: a claim/code mapper, a literature and dataset researcher, and a methods/evaluation auditor. The root agent validates anchors and sources, reconciles conflicts, and returns the structured review.
- `single-agent-fallback` — after a 150-second Multi-agent timeout or non-cancellation failure, the stable reviewer gets one attempt of up to 90 seconds.
- `cached-demo` — a deterministic LeafLens result for the public judge path and for local use without an API key.

Client cancellation stops processing and does not trigger fallback. If both live modes fail for a student upload, the upload receives an error and a link to the cached LeafLens demo; the system does not silently relabel cached output as live analysis.

## API

- `POST /api/review` accepts an ungated prepared JSON request for the cached study, or an access-authorized multipart prepared/live upload, and streams NDJSON events including real specialist, source, completion, and failure events.
- `POST /api/coach` evaluates a diagnosis and revision plan in the context of one finding and prior attempts.
- `GET /api/health` reports only whether live review and Multi-agent review are available.
- `POST /api/access` validates the judge access code and sets an HttpOnly, same-site session cookie.

The cached LeafLens demo remains ungated. Hosted live review is additionally protected by origin validation, one concurrent review per session, input/output limits, a hashed `safety_identifier`, and the deployment-side rate limits in [docs/VERCEL_FIREWALL.md](docs/VERCEL_FIREWALL.md).

Production fails closed unless `JUDGE_ACCESS_CODE` is at least 16 characters and the independent `SESSION_SIGNING_SECRET` is at least 32 characters. JSON bodies are measured while streaming, so missing or forged `Content-Length` headers cannot bypass the access or coaching caps.

The in-process session lease prevents duplicate work within a warm Function instance. Because the no-database scope rules out a distributed lock, cross-instance concurrency is a documented limitation; the IP-level Vercel rules are the production cost boundary across instances.

## Inputs and privacy boundaries

- Manuscript: PDF, DOCX, Markdown, or text; 3 MB maximum.
- Code/context: up to 12 text-based source, notebook, data, or configuration files; 3 MB each.
- Combined upload: 4 MB maximum, leaving multipart overhead below Vercel's 4.5 MB request-body limit.
- Archives, executable binaries, and unsupported formats are rejected.

Second Lab never executes uploaded code, automatically edits a submission, creates student accounts, or intentionally persists student content in its own database. The Responses request uses `store: false`. Temporary OpenAI file uploads have a one-hour expiration backstop; deletion is retried, and the receipt records whether cleanup was confirmed. A cleanup failure therefore means the file may remain until the expiration backstop—it is not described as immediate deletion.

Application logs must not include manuscript text or code contents. The app may record operational metadata such as timing, usage, response ID, input hashes, and cleanup status. Uploaded text and retrieved pages are treated as untrusted evidence, never as instructions.

## Evidence and provenance

Every finding references source IDs and manuscript/code anchors. Text, Markdown, and source-code spans are checked deterministically against the uploaded file. PDF/DOCX anchors that cannot be checked exactly are labeled `model-located`.

Web citations are allowlisted from native web-search output. Only HTTPS URLs present in `web_search_call.action.sources` may be displayed; URL-citation annotations can supply titles but cannot introduce a new URL. Model-generated URLs outside the native action-source set are discarded.

The receipt records the resolved model, OpenAI response ID, prompt and schema versions, SHA-256 input hashes, timestamp, token usage, latency, execution mode, and cleanup result. It is evidence of the review and learning interaction—not a certification that the research is correct.

## Demo and evaluation data

- `public/` contains the synthetic LeafLens manuscript/code package and generated cached review artifacts.
- `pnpm demo:generate` regenerates the cached LeafLens result.
- The evaluation suite covers metric mismatch, data leakage, unsupported baseline claims, reproducibility defects, a mixed-defect project, and a clean control.
- [docs/EVALUATION_SCORECARD.md](docs/EVALUATION_SCORECARD.md) is the dated scorecard. Pending cells must be replaced only by an actual run.

Targets are: all three flagship LeafLens defects detected, at least 80% seeded-category recall, no unsupported high-severity finding on the clean control, and every displayed web URL present in the native source set.

For a live run, set `EVAL_BASE_URL` plus `EVAL_ACCESS_CODE` (or an existing `EVAL_ACCESS_COOKIE`) and the dated pricing variables in `.env.example`, then run `pnpm eval:live`. Run the six calls before enabling the production 3-per-10-minute rule, through an explicit operator exemption, or across two firewall windows.

## Verify

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm demo:generate
```

Before submission, also exercise the prepared and live flows at 1280px and 390px, including cancellation, fallback, receipt download, and a zero-console-error check. A live model evaluation, one real Vercel GPT-5.6 smoke test, and 1–2 short student-researcher or mentor sessions must be reported only after they occur.

## Architecture

```text
Browser
  |-- cached LeafLens -------------------------------------> learning loop
  `-- /api/review (NDJSON)
        |-- GPT-5.6 Multi-agent (3 specialists, 150 s)
        |      `-- root evidence validation/reconciliation
        `-- stable single-agent fallback (90 s)
                    |
                    v
             structured claim-evidence-code map
                    |
                    +--> /api/coach --> learning receipt
                    `--> cited review UI
```

Deterministic application code owns upload validation, citation allowlisting, anchor verification, structured-output validation, input hashing, receipt assembly, timeouts, cancellation, and cleanup reporting. The model performs interpretation and coaching within that boundary.

## What Codex contributed

Codex helped inspect the starting implementation, identify the unreliable Transformer example and simulated progress trail, design the LeafLens fixture and evidence schema, implement the review/coaching routes and UI loop, add security and cleanup controls, expand tests, and produce the evaluation and submission artifacts. Dated work and the primary `/feedback` session ID are recorded in [BUILD_LOG.md](BUILD_LOG.md).

Humans fixed the audience and product boundary, chose the defend/revise pedagogy, approved the synthetic study and honest fallback modes, set privacy constraints, reviewed product and visual decisions, obtained tester consent, and retain responsibility for every submission claim.

## Limitations

Second Lab does not execute experiments, prove novelty, certify scientific truth, detect misconduct, replace a teacher or mentor, or replace peer review. Missing datasets, experiment logs, inaccessible literature, ambiguous PDF extraction, and incomplete code can leave findings unresolved. Model judgments may still be wrong; the evidence map and status labels are designed to make those limits inspectable.

See [PLAN.md](PLAN.md) for scope and delivery, [BUILD_LOG.md](BUILD_LOG.md) for dated implementation evidence, and [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) for the final handoff.
