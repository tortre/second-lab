# Devpost draft — Second Lab

Replace every bracketed placeholder only with verified submission evidence.

## Title

Second Lab

## One-line description

An AI research-methods coach that teaches student scientists to defend claims with manuscript, code, methodology, and literature evidence.

## Category

Education

## Short pitch

Most AI writing tools help students produce an answer. Second Lab teaches a harder and more durable skill: defending whether a research claim is actually supported.

A student submits a manuscript and its code—or opens the synthetic LeafLens study. GPT-5.6 coordinates a claim/code mapper, a literature and dataset researcher, and a methods/evaluation auditor. A validating root reconciles their work into a claim–evidence–code map with inspectable excerpts, anchors, and citations. The correction stays hidden while the student explains why the issue matters and proposes a checkable revision. After assessment and one progressive hint, the student earns or reveals an evidence-backed correction and exports a learning receipt for a mentor.

Second Lab does not write the paper, execute uploaded code, or claim to certify scientific truth.

## Inspiration and problem

Student researchers often learn that a result is weak only when a mentor, fair judge, or reviewer asks an uncomfortable question: Does the paper report the metric the code really calculates? Did related samples leak across the split? Was the claimed baseline ever run? Generic AI editing can make prose smoother without teaching the student how to answer those questions.

Second Lab turns pre-submission review into a learning loop. The goal is not “fix my paper.” It is “show me the evidence, make me defend the consequence, and make my revision testable.”

## What it does

- **No project? Try the demo:** opens LeafLens, a synthetic leaf-species classifier with a metric mismatch, augmentation leakage, an unsupported baseline claim, and a reproducibility concern. When live review is available, the judge explicitly chooses the live or instant cached path.
- **Drop in a project:** accepts one manuscript and at least one code file, then streams the review trail.
- **Evidence map:** connects each finding to exact manuscript and code excerpts, deterministic line checks or visible `model-located` anchors, and HTTPS citations from native web-search output.
- **Defend and revise:** asks why the issue matters and what the student would change; GPT-5.6 grades understanding as `not-yet`, `developing`, or `mastered` and enforces a one-hint/two-attempt progression.
- **Mentor handoff:** exports attempts, the final explanation and revision plan, mastered concepts, unresolved concerns, sources, hashes, model/response provenance, usage, latency, execution mode, and cleanup status. It says learning receipt until every finding is mastered.

## How it was built

Second Lab is a Next.js 16 and React 19 application using the OpenAI Responses API. The flagship live path uses GPT-5.6 Multi-agent beta with exactly three bounded specialists and `max_concurrent_subagents: 3`. A root agent validates evidence and returns a Zod-checked review. Real output items generate the NDJSON trail; no timer-generated agent stages are shown.

The Multi-agent call has a 150-second bound. Non-cancellation failure invokes one stable single-agent attempt with a 90-second bound. Cancellation aborts processing and never starts fallback. Every result is labeled `multi-agent`, `single-agent-fallback`, or `cached-demo`.

Trust controls include native web-source allowlisting, HTTPS-only citations, exact URL rendering, deterministic line verification, source-backed finding filtering, structured output validation, file signatures and bounded multipart parsing, prompt-injection boundaries, `store: false`, one-hour upload expiry, deletion retries, SHA-256 hashes, origin/access checks, a hashed safety identifier, and deployment firewall limits.

## Evaluation

The repository includes six synthetic cases: metric mismatch, leakage, unsupported baseline, reproducibility, mixed LeafLens, and a clean control. The dated deterministic fixture check detects 8 of 8 seeded categories, all three flagship defects, and no clean-control false positive. This validates the fixtures and harness, not GPT-5.6 quality.

Live scorecard: **[PENDING — insert only after the recorded six-case model run]**

Student/mentor sessions: **[PENDING — report exact sample, completion time, concern, and permissioned quote]**

## How Codex helped

Codex inspected the original reviewer, identified the unreliable Transformer example and simulated progress, helped define the education boundary and LeafLens fixture, implemented the evidence schemas and routes, built the defend/revise interface and receipt, added security and cleanup controls, wrote the evaluation harness and tests, and verified the responsive browser flows. Dated details and the primary `/feedback` Session ID are in `BUILD_LOG.md`.

Humans fixed the student audience, chose the pedagogy and scope, approved product and visual decisions, own all submission claims, and are responsible for tester consent and organizer eligibility confirmation.

## Limitations

Second Lab does not run experiments, prove novelty, detect misconduct, certify a paper, replace a mentor, or replace peer review. Missing data and code can make a conclusion unreviewable. PDF/DOCX locations may be model-located. Model judgments can still be wrong. The no-database architecture makes the per-session concurrency lease instance-local; production IP limits provide the cross-instance cost boundary.

## Links

- Project: [Second Lab](https://second-lab.vercel.app)
- Judge-accessible repository: [tortre/second-lab](https://github.com/tortre/second-lab)
- Demo video: **[PENDING]**
- Evaluation artifact: `/demo/evaluation-scorecard.json`

## Screenshot set

1. Desktop landing page with the single drop zone and demo link.
2. Mobile 390px landing page with both choices in the first viewport.
3. Real specialist trail with `multi-agent` label — capture only after the live smoke test.
4. One-finding lesson showing “Paper says,” “Code shows,” and the collapsed proof panel.
5. First coaching attempt with progressive hint.
6. Mastered revision and receipt.
7. Dated live evaluation scorecard.
