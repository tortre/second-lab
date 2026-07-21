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

For each finding, Second Lab maps a claim to the exact manuscript excerpt, exact code excerpt, stable file-line or section anchor, and supporting sources. It reports `confirmed`, `concern`, or `unverified`; it does not display invented confidence percentages.

## Learning loop

The correction is hidden at first. For each finding, the student answers:

1. **Why does this matter?**
2. **What would you revise?**

GPT-5.6 assesses the diagnosis and revision plan as `not-yet`, `developing`, or `mastered`. When the answer is incomplete, the coach gives one progressive hint. After two unsuccessful attempts, the student may reveal the evidence-backed correction. The downloadable learning receipt doubles as a mentor handoff and includes attempts, the final explanation, the revision plan, sources, mastered concepts, unresolved concerns, and review provenance. It is labeled a mastery receipt only after every finding is mastered.

When an API key is configured, this coaching assessment uses GPT-5.6 even on the prepared study. Without a key, the public demo uses a deterministic, honestly local fallback so the learning loop remains testable offline.

## What Codex contributed

Codex helped inspect the starting implementation, identify the unreliable Transformer example and simulated progress trail, design the LeafLens fixture and evidence schema, implement the review/coaching routes and UI loop, add security and cleanup controls, expand tests, and produce the evaluation and submission artifacts. Dated work and the primary `/feedback` session ID are recorded in [BUILD_LOG.md](BUILD_LOG.md).

Humans fixed the audience and product boundary, chose the defend/revise pedagogy, approved the synthetic study and honest fallback modes, set privacy constraints, reviewed product and visual decisions, obtained tester consent, and retain responsibility for every submission claim.

Second Lab does not execute experiments, prove novelty, certify scientific truth, detect misconduct, replace a teacher or mentor, or replace peer review. Missing datasets, experiment logs, inaccessible literature, ambiguous PDF extraction, and incomplete code can leave findings unresolved. Model judgments may still be wrong; the evidence map and status labels are designed to make those limits inspectable.

See [PLAN.md](PLAN.md) for scope and delivery, [BUILD_LOG.md](BUILD_LOG.md) for dated implementation evidence, and [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) for the final handoff.
