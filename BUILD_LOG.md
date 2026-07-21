# Second Lab build log

This file separates verified work from intended work. A checked item must have reproducible evidence in the repository or deployment.

## 2026-07-14 — Baseline and direction

### Verified baseline

- [x] Inspected the existing Next.js manuscript/code review workspace.
- [x] Confirmed the starting quality gates: 7 tests, TypeScript, ESLint, production build, and the prepared browser flow passed before the Education refactor.
- [x] Identified the existing Transformer finding as unreliable: `d_model` was sourced from `query.shape[-1]`, so the variable-name difference did not establish a numerical scaling mismatch.
- [x] Identified simulated progress timers, hidden mobile demo access, undersized result text, missing citation allowlisting, weak cleanup reporting, and the absence of a learning loop as priority gaps.

### Human decisions

- [x] Fixed the audience as high-school and undergraduate student researchers.
- [x] Chose “defend, then revise” instead of paper-writing or automatic editing.
- [x] Approved synthetic LeafLens as the judge path and a clean variant as the control.
- [x] Approved three honest execution modes: Multi-agent, stable single-agent fallback, and cached demo.
- [x] Kept accounts, database persistence, teacher dashboards, collaboration, and uploaded-code execution out of scope.
- [x] Chose the receipt as both learning record and mentor handoff.

### Codex implementation work started

- [x] Repositioned README and plan around research-methods learning.
- [x] Added privacy, evidence, architecture, evaluation, firewall, and submission documentation.
- [x] LeafLens fixtures and cached result verified with `pnpm demo:generate`, fixture tests, and `pnpm eval:cached`.
- [x] Shared evidence, coaching, and receipt schemas verified by TypeScript and Zod-backed tests.
- [x] Multi-agent event parsing, exact-three-specialist enforcement, timeout/cancellation behavior, and stable fallback implementation verified in automated tests. A production model smoke test is still pending.
- [x] Defend/revise UI and downloadable learning receipt verified in real desktop and mobile browsers; mastery wording is reserved for a fully mastered review.
- [x] Security, citation allowlisting, anchoring, cancellation, timeout, bounded upload, and cleanup failure paths verified by the automated suite.
- [x] Responsive prepared cached-demo browser flow verified at desktop and mobile sizes.
- [ ] Responsive live GPT-5.6 browser flow verified with production credentials.
- [ ] Live Vercel GPT-5.6 smoke test recorded.
- [ ] Six-case live evaluation recorded.
- [ ] 1–2 consented user sessions recorded.

## Evidence still required before submission

- Initial baseline commit hash: `85a09f9`
- Education implementation commit hash: `1e6c2e4`
- Simplified local landing commit hash: `e12e140`
- Submission-readiness fixes: `7039b04` and verified application commit `b98ad9ffacad199430c587860676cec8a54bb054`; public remote `main` includes both
- Production deployment URL: `https://second-lab.vercel.app`
- Judge-accessible repository URL: `https://github.com/tortre/second-lab` (public)
- Live smoke-test timestamp and response ID: `PENDING`
- Cached evaluation artifact/command: `docs/EVALUATION_SCORECARD.md` / `pnpm eval:cached`
- Live evaluation artifact/command: `PENDING`
- User-session notes and attributable quote permission: `PENDING`
- Public YouTube demo URL: `PENDING`
- Devpost submission URL: `PENDING`
- Primary Codex `/feedback` Session ID: `019f5c7d-1784-7022-bab3-6c85650d765c`

Do not turn any pending item into a submission claim until it is replaced by evidence.

## 2026-07-14 — Implementation verification

### Automated gates

- [x] `pnpm verify` regenerated five deterministic demo artifacts.
- [x] Vitest: 16 files, 58 tests passed after the submission-readiness fixes.
- [x] TypeScript: `tsc --noEmit` passed.
- [x] ESLint passed.
- [x] Next.js 16 production build completed with `/`, `/api/access`, `/api/coach`, `/api/health`, and `/api/review`.
- [x] Cached six-case fixture validation: 8/8 seeded categories, 0 false positives, all 3 flagship defects, clean control with 0 unsupported high-severity findings. This is not a live model score.

### Browser evidence

- [x] Earlier 1280 × 900 flow: landing, cached review, four finding maps, clickable sources, first hint, two-attempt reveal, mastered response, and receipt download passed with no page errors or framework overlay.
- [x] Earlier 390 × 844 flow: landing and results had no horizontal overflow; coaching and receipt download passed with no page errors.
- [x] Client cancellation returned to the landing screen with “Review cancelled. No fallback was started.”
- [x] Missing manuscript and missing code validation appeared before a live request.
- [x] A live upload without a configured API key failed honestly and displayed the cached LeafLens recovery link.

### Honest boundary

The local browser environment had no `OPENAI_API_KEY`, so these checks do not count as the required live GPT-5.6 smoke test, live Multi-agent trail, or live six-case evaluation. The demo now waits for health and explicitly asks a gated judge to choose **Run live demo** or **Use instant demo**, so it cannot silently select cached output while access is required.

## 2026-07-14 — Submission-readiness audit and local-only usability pass

- [x] Commit `e12e140` replaced the marketing-heavy landing page with one drop zone and **No project? Try the demo**.
- [x] Local landing verified at 1280 × 720 and 390 × 844 with the demo link visible, no horizontal overflow, no framework overlay, and no browser console errors.
- [x] Cached LeafLens opened in one click and displayed all four source-backed findings and clickable citations.
- [x] A weak first coaching attempt returned `not-yet` plus one hint; two unsuccessful attempts unlocked the evidence-backed correction.
- [x] Public cached coaching is now bound to the server-owned LeafLens fixture, forced deterministic, and cannot be converted into a paid GPT call by a forged `cached-demo` request.
- [x] The cached mastery heuristic now requires evidence linkage, methodological consequence, a specific revision, and a checkable verification step; `accuracy` plus `f1_score` no longer earns mastery.
- [x] Verified text/code locators are recomputed server-side, and evidence excerpts require at least eight non-whitespace characters.
- [x] Results were simplified locally to one finding at a time with **Paper says**, **Code shows**, **Why it matters**, and collapsed proof.
- [x] Learning-receipt wording and unresolved counts are shown until every finding is mastered.
- [x] `pnpm verify`, `pnpm eval:cached`, and `git diff --check` passed after these fixes: 16 files, 58 tests, a clean production build, 8/8 seeded fixture findings, and 0 unsupported fixture findings.
- [x] Final post-change browser pass repeated on July 21 at 1280 × 720 and 390 × 844 with no console errors, framework overlay, or horizontal overflow.
- [x] The verified interface and fixes were deployed to production on July 21.

### Technical release issues still open

- [x] Reserve bounded upload and cleanup time inside the 270-second Function window: uploads have a 20-second bound, cleanup keeps a 10-second reserve with parallel 3-second deletion attempts, and fallback uses only the remaining time up to 90 seconds.
- [x] Preserve metadata-only cleanup status in `review.failed` when a live review fails before a receipt exists.
- [ ] Make the live evaluation independently compare displayed citations with preserved native source URLs.
- [x] Bound chunked JSON bodies for `/api/access` and `/api/coach` and fail closed unless production judge/session secrets meet minimum lengths.
- [ ] Throttle `/api/access` attempts at the deployment firewall.

## 2026-07-14 — Vercel deployment verification

- [x] Created an isolated Vercel project named `second-lab`; no existing project was modified.
- [x] Deployment `dpl_Drss5XPSsFJ2vW83peTRexxJNrB5` reached `READY` after a clean remote Next.js build.
- [x] `https://second-lab.vercel.app/` returned HTTP 200 with the research-methods coach landing page.
- [x] `GET /api/health` returned HTTP 200 and truthfully reported `liveReview: false`, `multiAgent: false`, and `accessRequired: false`.
- [x] The deployed cached LeafLens review streamed `review.started`, `review.mode`, actual fixture-agent events, six `source.found` events, and `review.completed`.
- [x] The deployed coaching endpoint assessed an evidence-based metric diagnosis and revision plan as `mastered`.
- [x] Vercel reported no runtime error clusters during the deployment smoke-test window.
- [ ] Live GPT-5.6 smoke test: blocked until `OPENAI_API_KEY`, `JUDGE_ACCESS_CODE`, and `SESSION_SIGNING_SECRET` are configured in Vercel.

## 2026-07-21 — Final technical submission audit

- [x] `pnpm verify` passed: 16 test files, 58 tests, TypeScript, ESLint, and the Next.js production build.
- [x] `pnpm eval:cached` reported 8/8 seeded findings and 0 unsupported findings; `git diff --check` passed.
- [x] Fresh local desktop flow passed from landing through four mastered findings and a downloaded mastery receipt; all `/api/review` and `/api/coach` requests returned HTTP 200.
- [x] Fresh local mobile checks at 390 × 844 passed for the landing and results views with no horizontal overflow.
- [x] Public repository `https://github.com/tortre/second-lab` resolves without authentication and remote `main` includes verified application commit `b98ad9ffacad199430c587860676cec8a54bb054`.
- [x] Production deployment `dpl_EMp386m1V2z7d5C95iFA1zuDMZcc` reached `READY` and owns the `second-lab.vercel.app` alias.
- [x] Production returned HTTP 200, rendered the current **Check your research** judge path, completed the four-finding cached review, and assessed an evidence-linked coaching response as `mastered` with no browser console errors.
- [x] Vercel reported no runtime error clusters during the post-deploy verification window.
- [x] Production health truthfully reports `liveReview: false`, `multiAgent: false`, and `accessRequired: false`; this audit is cached-demo proof, not a live GPT-5.6 runtime smoke test.
- [ ] Devpost project/team/submission state could not be checked until the operator signs in to Devpost in the browser.
