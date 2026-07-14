# Second Lab — Plan

## Objective

Build a concise pre-submission reviewer for active computational researchers. The researcher supplies an unpublished manuscript and working code; the reviewer investigates the surrounding literature and surfaces issues with evidence.

## Product flow

1. Accept one manuscript plus the implementation and configuration files most relevant to its results.
2. Extract central claims, contributions, methods, datasets, metrics, and reported evidence.
3. Trace those details into the supplied code.
4. Research prior papers, dataset documentation, benchmark protocols, and evaluation standards.
5. Form checks tailored to the manuscript rather than using an expected finding list.
6. Show specific findings, uncertainty, related work, and an exportable receipt.

## Model boundary

GPT-5.6 receives temporary manuscript and code file inputs and uses web search for prior literature. Deterministic code owns file validation, upload limits, response structure, temporary-file deletion, and receipt assembly. The prepared landmark-paper package is only an offline demonstration path.

## Review boundary

The reviewer inspects but does not execute supplied code. It cannot prove novelty or scientific truth. Retrieved pages and uploaded content are treated as untrusted evidence, not instructions. Findings must distinguish a supported discrepancy from a concern or missing evidence.

## Verification

- Unit tests for upload validation and receipt contents
- TypeScript, ESLint, and production build
- Browser flow for manuscript inputs, prepared review, receipt, and responsive layout
