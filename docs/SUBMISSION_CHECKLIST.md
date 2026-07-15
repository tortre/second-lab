# Build Week submission checklist

Deadline: **July 21, 2026 at 5:00 PM PT / 7:00 PM CT.** Target submission: July 20; July 21 is buffer only.

## Eligibility and access

- [ ] The eligible parent/guardian has registered, joined the project, and is prepared to submit and represent the entry.
- [ ] The entrant satisfies the residency, employment/conflict, and other eligibility terms in the official rules.
- [ ] Any remaining guardian-structure question has been resolved with Devpost support; separate confirmation is not required by the published rules.
- [ ] Optional: Codex credit request is submitted while credits remain available.
- [ ] Judge access code is tested in a fresh browser session.
- [ ] Cached LeafLens demo works without access and without an API key.

## Product evidence

- [ ] The paper/code drop zone and **No project? Try the demo** are visible at 1280px and 390px.
- [ ] When live access is required, the judge explicitly sees **Run live demo** and **Use instant demo**; the app never silently downgrades a live request.
- [ ] LeafLens surfaces metric mismatch, leakage, and unsupported baseline findings.
- [ ] The unreliable Transformer finding is absent from the judge path.
- [ ] Every finding has status, source IDs, exact excerpts, and stable or visibly model-located anchors.
- [ ] Every displayed web URL is HTTPS and present in native source output.
- [ ] Direct correction is hidden initially; assessment, hint, two-attempt reveal, and learning receipt work.
- [ ] Receipt includes attempts, final explanation, revision plan, sources, mastered/unresolved concepts, and full provenance.
- [ ] Incomplete exports say learning receipt; mastery wording appears only after every finding is mastered.
- [ ] Core instructional/result text is 15–16px; technical proof metadata is at least 12px.

## Reliability, privacy, and security

- [ ] Multi-agent trail is derived from real output events, not timers.
- [ ] Multi-agent, fallback, and cached executions are honestly labeled.
- [ ] 150-second Multi-agent and 90-second fallback bounds are tested.
- [ ] Cancellation does not trigger fallback.
- [ ] Upload failure links to LeafLens instead of silently returning cached output.
- [ ] No uploaded code is executed; no student content is put in application logs or a product database.
- [ ] `store: false`, one-hour file expiration, deletion retries, and cleanup reporting are verified.
- [ ] Origin, judge access, one-review-per-session, size/output, and hashed safety-identifier checks are verified.
- [ ] Public cached coaching is bound to the server-owned fixture, forced deterministic, and cannot trigger a paid GPT call.
- [ ] The bounded upload/fallback/cleanup budget is confirmed in one real live smoke test inside the 270-second Function window.
- [ ] A failed live review's metadata-only cleanup status is confirmed in deployed NDJSON output.
- [ ] Production access/session secrets meet the code-enforced minimum strength.
- [ ] `/api/access` attempts are throttled at the deployment firewall.
- [ ] Vercel Firewall rules from `docs/VERCEL_FIREWALL.md` are active and 429-tested.

## Quality gates

```bash
pnpm demo:generate
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

- [ ] Six-case scorecard is replaced with actual, dated live GPT-5.6 results.
- [ ] Live citation validity is independently compared with preserved native source URLs, not inferred from the server's verification label.
- [ ] Prepared and live flows pass at 1280px and 390px with zero console errors.
- [ ] Cancellation, fallback, receipt download, malformed output, prompt injection, timeout, cleanup failure, access, origin, and upload-limit cases pass.
- [ ] One production Vercel GPT-5.6 smoke test is recorded.
- [ ] 1–2 user sessions are reported exactly, with quote permission where applicable.

## Repository and build evidence

- [ ] A clean, dated repository is either public with a relevant license or private and shared with `testing@devpost.com` and `build-week-event@openai.com`.
- [ ] README covers setup, sample data, tests, architecture, Codex contribution, human decisions, privacy, evaluation, and limitations.
- [ ] `BUILD_LOG.md` pending fields are replaced with evidence.
- [ ] Primary implementation `/feedback` Session ID is recorded and submitted.
- [ ] No secrets, real student work, temporary uploads, or unredacted security output are committed.

## Demo video: 2:45–2:55

Suggested sequence:

| Time | Shot |
| --- | --- |
| 0:00–0:20 | Problem and student audience; “teach defense, do not write the paper.” |
| 0:20–0:40 | One-click LeafLens study and its synthetic manuscript/code. |
| 0:40–1:10 | Real three-specialist trail and execution-mode label; record only after the live smoke test. |
| 1:10–1:35 | Claim-evidence-code finding, verified anchor, and clickable native citation. |
| 1:35–2:05 | Student defense, incomplete assessment, progressive hint, revised answer. |
| 2:05–2:25 | Mastered revision plan and downloadable mentor-handoff receipt. |
| 2:25–2:45 | Six-case scorecard, privacy boundary, and limitations. |
| 2:45–2:55 | Education impact and project URL. |

- [ ] Public, embeddable YouTube link opens signed out.
- [ ] Video is under the required duration.
- [ ] Screen text is legible and no secret, access code, or private file is visible.
- [ ] Video contains no unauthorized music, trademarks, or third-party copyrighted material.
- [ ] Spoken claims match repository/deployment evidence.

## Devpost

- [ ] Title, one-line description, Education category, and project URL are final.
- [ ] Problem, learning design, technical implementation, privacy, evaluation, limitations, and Codex contribution are covered.
- [ ] Screenshots show desktop, mobile, evidence map, coaching, receipt, and scorecard.
- [ ] Official FAQ and submission resources were rechecked on submission day.
- [ ] Submission is complete before 5:00 PM PT / 7:00 PM CT on July 21.
- [ ] The free working project will remain available without restriction through August 5, 2026 at 5:00 PM PT.
- [ ] The final entry has been checked carefully because submissions cannot be changed after the July 21 deadline.
