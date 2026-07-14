# Second Lab evaluation scorecard

**Scorecard date:** 2026-07-14
**Status:** Deterministic fixture validation completed; live GPT-5.6 evaluation pending.

## Verified fixture validation

On 2026-07-14, `pnpm eval:cached` evaluated all six synthetic cases using deterministic checks over the seeded manuscript and code artifacts. It found 8 of 8 seeded categories, all three flagship LeafLens defects, no unsupported finding in the clean control, and no fixture false positives. The raw artifact is [`public/demo/evaluation-scorecard.json`](../public/demo/evaluation-scorecard.json).

These numbers validate the fixture labels and evaluation plumbing only. They are **not** a GPT-5.6 quality score and include no live citation, latency, token, or cost result.

| Fixture gate | Result |
| --- | ---: |
| Cases evaluated | 6 |
| Seeded categories detected | 8 / 8 |
| Flagship defects detected | 3 / 3 |
| Fixture false positives | 0 |
| Unsupported high-severity findings on clean control | 0 |

## Live-model reporting contract

Do not replace `Pending` with estimates. Record the exact commit, resolved model, prompt/schema versions, timestamp, execution mode, and raw machine-readable output for the run.

## Targets

| Gate | Target | Result |
| --- | ---: | --- |
| Flagship LeafLens defects | 3 / 3 | Pending |
| Seeded-category recall | >= 80% | Pending |
| Unsupported high-severity findings on clean control | 0 | Pending |
| Displayed URLs in native source allowlist | 100% | Pending |

## Six-case suite

| Case | Seeded categories | Expected high-severity findings | Recall | Unsupported findings | Citation validity | Latency | Tokens | Estimated cost |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| Metric mismatch | metric mismatch | 1 | Pending | Pending | Pending | Pending | Pending | Pending |
| Leakage | leakage | 1 | Pending | Pending | Pending | Pending | Pending | Pending |
| Unsupported baseline | unsupported claim | 1 | Pending | Pending | Pending | Pending | Pending | Pending |
| Reproducibility | reproducibility | 1 | Pending | Pending | Pending | Pending | Pending | Pending |
| Mixed-defect LeafLens | metric, leakage, baseline | 3 | Pending | Pending | Pending | Pending | Pending | Pending |
| Clean control | none | 0 | Pending | Pending | Pending | Pending | Pending | Pending |

## Scoring rules

- A seeded category counts as recalled only when a finding identifies the same methodological defect and points to the relevant supplied evidence.
- A finding is unsupported when its severity/status is stronger than its verified anchors and cited evidence justify.
- Citation validity is the share of displayed web URLs that are HTTPS and occur in the native web-search source set for that response.
- The clean-control gate concerns unsupported **high-severity** findings; lower-severity concerns still require inspectable evidence.
- Cost is estimated from recorded input/output tokens and the model price at run time. Record the pricing source date.
- Supply `EVAL_INPUT_COST_PER_MILLION`, `EVAL_OUTPUT_COST_PER_MILLION`, and a dated `EVAL_PRICING_SOURCE` for the live harness; it derives cost from receipt token totals rather than inventing a provenance field.
- Run the six live calls before enabling the 3-per-10-minute production firewall rule, from an explicitly exempt operator path, or across two rate-limit windows. Never weaken the public production rule silently.

## Run record

- Commit: `PENDING`
- Command: `PENDING`
- Resolved model: `PENDING`
- Prompt version: `PENDING`
- Schema version: `PENDING`
- UTC timestamp: `PENDING`
- Raw artifact: `PENDING`
- Reviewer/sign-off: `PENDING`

## User-session impact check

Run 1–2 short, consented sessions with a student researcher or research mentor. Report the sample size exactly.

| Measure | Session 1 | Session 2 |
| --- | --- | --- |
| Role and research level | Pending | Pending |
| Completed defend/revise without help | Pending | Pending |
| Time to completion | Pending | Pending |
| Main trust concern | Pending | Pending |
| Largest usability issue | Pending | Pending |
| Quote approved for attribution | Pending | Pending |

Do not publish a quote without explicit permission, and do not generalize beyond the tiny sample.
