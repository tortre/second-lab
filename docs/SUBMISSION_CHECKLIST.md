# Build Week submission checklist

Deadline: **July 21, 2026 at 5:00 PM PT / 7:00 PM CT.** Target submission: July 20; July 21 is buffer only.

## Eligibility and access

- [ ] Organizer has confirmed the guardian-entry structure in writing.
- [ ] Guardian is prepared to represent the entry as required.
- [ ] Codex credit request is submitted.
- [ ] Judge access code is tested in a fresh browser session.
- [ ] Cached LeafLens demo works without access and without an API key.

## Product evidence

- [ ] **Try a student study** and **Review my project** are visible at 1280px and 390px.
- [ ] LeafLens surfaces metric mismatch, leakage, and unsupported baseline findings.
- [ ] The unreliable Transformer finding is absent from the judge path.
- [ ] Every finding has status, source IDs, exact excerpts, and stable or visibly model-located anchors.
- [ ] Every displayed web URL is HTTPS and present in native source output.
- [ ] Direct correction is hidden initially; assessment, hint, two-attempt reveal, and mastery receipt work.
- [ ] Receipt includes attempts, final explanation, revision plan, sources, mastered/unresolved concepts, and full provenance.
- [ ] Result text is at least 12px.

## Reliability, privacy, and security

- [ ] Multi-agent trail is derived from real output events, not timers.
- [ ] Multi-agent, fallback, and cached executions are honestly labeled.
- [ ] 150-second Multi-agent and 90-second fallback bounds are tested.
- [ ] Cancellation does not trigger fallback.
- [ ] Upload failure links to LeafLens instead of silently returning cached output.
- [ ] No uploaded code is executed; no student content is put in application logs or a product database.
- [ ] `store: false`, one-hour file expiration, deletion retries, and cleanup reporting are verified.
- [ ] Origin, judge access, one-review-per-session, size/output, and hashed safety-identifier checks are verified.
- [ ] Vercel Firewall rules from `docs/VERCEL_FIREWALL.md` are active and 429-tested.

## Quality gates

```bash
pnpm demo:generate
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

- [ ] Six-case scorecard is replaced with actual, dated results.
- [ ] Prepared and live flows pass at 1280px and 390px with zero console errors.
- [ ] Cancellation, fallback, receipt download, malformed output, prompt injection, timeout, cleanup failure, access, origin, and upload-limit cases pass.
- [ ] One production Vercel GPT-5.6 smoke test is recorded.
- [ ] 1–2 user sessions are reported exactly, with quote permission where applicable.

## Repository and build evidence

- [ ] Public repository has a license and a clean, dated history.
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
| 0:40–1:10 | Real three-specialist trail and execution-mode label. |
| 1:10–1:35 | Claim-evidence-code finding, verified anchor, and clickable native citation. |
| 1:35–2:05 | Student defense, incomplete assessment, progressive hint, revised answer. |
| 2:05–2:25 | Mastered revision plan and downloadable mentor-handoff receipt. |
| 2:25–2:45 | Six-case scorecard, privacy boundary, and limitations. |
| 2:45–2:55 | Education impact and project URL. |

- [ ] Public, embeddable YouTube link opens signed out.
- [ ] Video is under the required duration.
- [ ] Screen text is legible and no secret, access code, or private file is visible.
- [ ] Spoken claims match repository/deployment evidence.

## Devpost

- [ ] Title, one-line description, Education category, and project URL are final.
- [ ] Problem, learning design, technical implementation, privacy, evaluation, limitations, and Codex contribution are covered.
- [ ] Screenshots show desktop, mobile, evidence map, coaching, receipt, and scorecard.
- [ ] Official FAQ and submission resources were rechecked on submission day.
- [ ] Submission is complete before 5:00 PM PT / 7:00 PM CT on July 21.
