# Second Lab

Pre-submission review for computational research.

Second Lab starts from a researcher's unpublished manuscript and working code. It reads the draft, traces claims into the implementation, searches prior literature and evaluation standards, forms checks for that specific project, and returns a cited review for the authors to inspect before submission.

The bundled landmark-paper packages are secondary examples, not the product's focus.

## Run

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), add a manuscript and relevant code files, optionally describe the research area or target venue, then start the review.

`OPENAI_API_KEY` is required for manuscript review. The server sends temporary file inputs to the OpenAI Files API, runs a non-stored GPT-5.6 response with web search, and deletes those API files after the review attempt. Without a key, the prepared example remains available.

## Review flow

1. Read the manuscript and extract its claims and claimed contributions.
2. Inspect the supplied implementation and configuration files.
3. Search related papers, dataset documentation, benchmarks, and evaluation conventions.
4. Form project-specific checks for novelty overlap, missing citations, manuscript-code consistency, data methodology, metrics, statistics, reproducibility, and claim strength.
5. Return findings with manuscript, code, and literature anchors plus explicit uncertainty.
6. Export a Markdown review receipt for the research team.

## Input boundary

- Manuscript: PDF, DOCX, Markdown, or text; 8 MB maximum.
- Code: up to 12 text-based source, notebook, data, or configuration files; 8 MB each.
- Combined upload: 20 MB maximum.
- Archives and executable binaries are rejected. Supplied code is inspected but never executed.

## Project map

- `src/components/second-lab-workspace.tsx` — manuscript upload and review workspace
- `src/lib/agentic-review.ts` — file validation, temporary uploads, literature-research agent, and receipt
- `src/app/api/audit/route.ts` — multipart manuscript-review boundary
- `src/lib/study.ts` — prepared example metadata and source anchors
- `src/lib/audit.ts` — deterministic prepared-example registry
- `src/lib/model.ts` — prepared-example structured review
- `public/papers/` — local example notes and implementation artifacts

## Verification

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Second Lab does not execute experiments, prove novelty, certify scientific truth, replace peer review, or make misconduct findings. Missing datasets, environment files, experiment logs, or inaccessible literature can leave checks unresolved.
