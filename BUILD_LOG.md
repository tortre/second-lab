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
- [x] Defend/revise UI and downloadable mastery receipt verified in real desktop and mobile browsers.
- [x] Security, citation allowlisting, anchoring, cancellation, timeout, bounded upload, and cleanup failure paths verified by the 40-test suite.
- [x] Responsive prepared cached-demo browser flow verified at desktop and mobile sizes.
- [ ] Responsive live GPT-5.6 browser flow verified with production credentials.
- [ ] Live Vercel GPT-5.6 smoke test recorded.
- [ ] Six-case live evaluation recorded.
- [ ] 1–2 consented user sessions recorded.

## Evidence still required before submission

- Initial baseline commit hash: `85a09f9`
- Education implementation commit hash: `1e6c2e4`
- Production deployment URL: `https://second-lab.vercel.app`
- Live smoke-test timestamp and response ID: `PENDING`
- Cached evaluation artifact/command: `docs/EVALUATION_SCORECARD.md` / `pnpm eval:cached`
- Live evaluation artifact/command: `PENDING`
- User-session notes and attributable quote permission: `PENDING`
- Public YouTube demo URL: `PENDING`
- Devpost submission URL: `PENDING`
- Primary Codex `/feedback` Session ID: `PENDING — add after the primary implementation task`

Do not turn any pending item into a submission claim until it is replaced by evidence.

## 2026-07-14 — Implementation verification

### Automated gates

- [x] `pnpm verify` regenerated five deterministic demo artifacts.
- [x] Vitest: 15 files, 40 tests passed.
- [x] TypeScript: `tsc --noEmit` passed.
- [x] ESLint passed.
- [x] Next.js 16 production build completed with `/`, `/api/access`, `/api/coach`, `/api/health`, and `/api/review`.
- [x] Cached six-case fixture validation: 8/8 seeded categories, 0 false positives, all 3 flagship defects, clean control with 0 unsupported high-severity findings. This is not a live model score.

### Browser evidence

- [x] 1280 × 900: landing, both entry actions, cached review, four finding maps, clickable sources, first hint, two-attempt reveal, mastered response, and receipt download passed with no page errors or framework overlay.
- [x] 390 × 844: both entry actions appeared in the first viewport; landing and results had no horizontal overflow; mastery and receipt download passed with no page errors.
- [x] Client cancellation returned to the landing screen with “Review cancelled. No fallback was started.”
- [x] Missing manuscript and missing code validation appeared before a live request.
- [x] A live upload without a configured API key failed honestly and displayed the cached LeafLens recovery link.

### Honest boundary

The local browser environment had no `OPENAI_API_KEY`, so these checks do not count as the required live GPT-5.6 smoke test, live Multi-agent trail, or live six-case evaluation. The prepared button now selects the live multipart LeafLens path only when live review and access are available; otherwise it uses the public `cached-demo` result.

## 2026-07-14 — Vercel deployment verification

- [x] Created an isolated Vercel project named `second-lab`; no existing project was modified.
- [x] Deployment `dpl_Drss5XPSsFJ2vW83peTRexxJNrB5` reached `READY` after a clean remote Next.js build.
- [x] `https://second-lab.vercel.app/` returned HTTP 200 with the research-methods coach landing page.
- [x] `GET /api/health` returned HTTP 200 and truthfully reported `liveReview: false`, `multiAgent: false`, and `accessRequired: false`.
- [x] The deployed cached LeafLens review streamed `review.started`, `review.mode`, actual fixture-agent events, six `source.found` events, and `review.completed`.
- [x] The deployed coaching endpoint assessed an evidence-based metric diagnosis and revision plan as `mastered`.
- [x] Vercel reported no runtime error clusters during the deployment smoke-test window.
- [ ] Live GPT-5.6 smoke test: blocked until `OPENAI_API_KEY`, `JUDGE_ACCESS_CODE`, and `SESSION_SECRET` are configured in Vercel.
