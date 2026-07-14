# Second Lab — Education Build Week plan

## Objective

Build an AI research-methods coach for high-school and undergraduate researchers:

> Second Lab does not write the student's paper. It teaches them to defend every claim with code, methodology, and literature evidence.

The polished workspace and manuscript/code review foundation remain. This build concentrates on Education fit, trustworthy evidence, a real learning loop, and judge-visible GPT-5.6 depth.

## Scope

### Ship

- Two visible entry actions on desktop and mobile: **Try a student study** and **Review my project**.
- Synthetic LeafLens fixture with metric mismatch, leakage, and unsupported baseline defects, plus a clean control.
- Claim-evidence-code findings labeled `confirmed`, `concern`, or `unverified`.
- Deterministically verified text/code anchors and visibly `model-located` PDF/DOCX anchors.
- Native-source citation allowlisting and HTTPS-only links.
- GPT-5.6 Multi-agent review with three specialists, a validating root, and a stable single-agent fallback.
- Honest `multi-agent`, `single-agent-fallback`, and `cached-demo` execution labels.
- Defend/revise coaching with progressive hinting, two-attempt reveal, and a mastery receipt.
- Origin, access, concurrency, input/output, hashed-safety-identifier, cleanup, and deployment-rate-limit controls.
- Six-case evaluation harness, dated scorecard, responsive browser verification, documentation, and submission assets.

### Do not ship this week

- Accounts, a database, collaboration, or a teacher dashboard.
- Uploaded-code execution.
- Automatic manuscript edits.
- A claim that the product proves correctness, novelty, or misconduct.

## Review contract

1. Accept the prepared LeafLens JSON request or one manuscript plus relevant code/context files.
2. Extract important claims and map them to supplied evidence.
3. Research literature, dataset documentation, benchmarks, and evaluation conventions.
4. Have three specialists inspect claim/code consistency, external evidence, and methods/evaluation.
5. Have the root agent validate evidence, reconcile conflicts, and produce structured findings.
6. Stream events derived from real output items; do not simulate progress timers.
7. Hide the direct correction while the student diagnoses impact and proposes a revision.
8. Assess understanding, give one progressive hint, and allow reveal after two unsuccessful attempts.
9. Export a provenance-rich learning receipt for student reflection and mentor handoff.

## Reliability and privacy contract

- Multi-agent timeout: 150 seconds. Stable fallback timeout: 90 seconds.
- Cancellation stops all processing and never starts fallback.
- `store: false` for Responses; one-hour temporary-file expiration backstop; deletion retries with an honest cleanup result.
- No uploaded content in application logs, no local content persistence, and no code execution.
- Web URLs must be HTTPS and present in native source output.
- Text and code anchors are checked deterministically; unverifiable document anchors are labeled.
- Hosted live endpoints require allowed origin/access, allow one in-flight review per session, and enforce output limits.
- Deployment firewall: 3 review calls and 20 coaching calls per IP per 10 minutes.

## Evaluation gates

- Detect all three flagship LeafLens defects.
- Achieve at least 80% seeded-category recall across six cases.
- Produce no unsupported high-severity finding on the clean control.
- Display no web URL outside the native source allowlist.
- Complete prepared and live flows at 1280px and 390px with zero console errors.
- Verify cancellation, fallback, receipt download, malformed output, prompt injection, timeouts, cleanup failure, access, origin, upload limits, and coaching progression.
- Run one live Vercel GPT-5.6 smoke test and 1–2 short consented student-researcher or mentor sessions before claiming either result.

## Delivery

- **July 14:** record baseline; confirm guardian-entry structure with Devpost; request Codex credits; start dated build log.
- **July 15:** LeafLens fixture, Education positioning, evidence schema, and verified citations.
- **July 16–17:** streamed Multi-agent review, stable fallback, cleanup, access controls, and firewall runbook.
- **July 18:** defend/revise coaching, mastery receipt, evaluation harness, and deployment candidate.
- **July 19:** six-case run and 1–2 user sessions; fix the largest trust/usability issue.
- **July 20:** finalize README, license, build log, screenshots, Devpost copy, and public 2:45–2:55 demo video; submit early.
- **July 21:** buffer only; deadline is 5:00 PM PT / 7:00 PM CT.

## Submission story

The video sequence is: audience/problem → LeafLens → real specialist trail → verified finding and citation → student defense → hint → mastered revision plan → receipt → evaluation scorecard.

All deployment, evaluation, and user-study statements must be backed by a dated artifact in the repository. The final checklist is in `docs/SUBMISSION_CHECKLIST.md`.
