import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const caseSourcePath = path.join(root, "src/lib/evaluation/cases.json");
const defaultOutputPath = path.join(
  root,
  "public/demo/evaluation-scorecard.json",
);

const categories = [
  "metric-mismatch",
  "data-leakage",
  "unsupported-baseline",
  "reproducibility",
];

function detectSeededFixtureCategories({ manuscript, code }) {
  const detected = new Set();

  if (/macro[- ]?f1/i.test(manuscript) && /accuracy_score\s*\(/.test(code)) {
    detected.add("metric-mismatch");
  }

  const augmentationIndex = code.search(/(?:np\.rot90|augment|rotated)/i);
  const splitIndex = code.search(
    /(?:train_test_split\s*\(|splitter\.split\s*\()/,
  );
  const usesGroupedSplit = /GroupShuffleSplit|groups\s*=/.test(code);
  if (
    augmentationIndex >= 0 &&
    splitIndex > augmentationIndex &&
    !usesGroupedSplit
  ) {
    detected.add("data-leakage");
  }

  const claimsBaseline =
    /(?:outperform|better than|compared with)[\s\S]{0,120}baseline/i.test(
      manuscript,
    );
  const implementsBaseline =
    /(?:majority_(?:label|predictions?)|baseline\s*=|baseline\.fit|baseline_predictions?)/i.test(
      code,
    );
  if (claimsBaseline && !implementsBaseline) {
    detected.add("unsupported-baseline");
  }

  const explicitlyMissingReproducibility =
    /(?:seed|split IDs?)[\s\S]{0,80}(?:not saved|not recorded)/i.test(
      manuscript,
    );
  const unseededRandomSplit =
    /train_test_split\s*\(/.test(code) && !/random_state\s*=/.test(code);
  if (explicitlyMissingReproducibility || unseededRandomSplit) {
    detected.add("reproducibility");
  }

  return categories.filter((category) => detected.has(category));
}

function scoreOutcomes(outcomes) {
  const seededFindingCount = outcomes.reduce(
    (total, outcome) => total + outcome.expectedCategories.length,
    0,
  );
  const truePositives = outcomes.reduce(
    (total, outcome) => total + outcome.truePositives,
    0,
  );
  const falsePositives = outcomes.reduce(
    (total, outcome) => total + outcome.falsePositives,
    0,
  );
  const falseNegatives = outcomes.reduce(
    (total, outcome) => total + outcome.falseNegatives,
    0,
  );
  const flagship = outcomes.find((outcome) => outcome.caseId === "mixed-defects");
  const clean = outcomes.find((outcome) => outcome.caseId === "clean-control");
  const flagshipCategories = new Set([
    "metric-mismatch",
    "data-leakage",
    "unsupported-baseline",
  ]);

  return {
    caseCount: outcomes.length,
    seededFindingCount,
    truePositives,
    falsePositives,
    falseNegatives,
    seededCategoryRecall:
      seededFindingCount === 0 ? 1 : truePositives / seededFindingCount,
    unsupportedFindingRate:
      truePositives + falsePositives === 0
        ? 0
        : falsePositives / (truePositives + falsePositives),
    flagshipDefectsDetected:
      flagship?.detectedCategories.filter((category) =>
        flagshipCategories.has(category),
      ).length ?? 0,
    flagshipDefectsExpected: flagshipCategories.size,
    cleanControlUnsupportedHighSeverityFindings:
      clean?.unsupportedHighSeverityFindings ?? clean?.falsePositives ?? 0,
  };
}

function hasVerifiedClaimCodeEvidence(finding) {
  const anchors = Array.isArray(finding.anchors) ? finding.anchors : [];
  return finding.status !== "unverified"
    && Array.isArray(finding.sourceIds) && finding.sourceIds.length > 0
    && ["manuscript", "code"].every((kind) =>
      anchors.some((anchor) => anchor.kind === kind && anchor.verification === "verified"),
    );
}

export function scoreCase(caseId, expectedCategories, findings, requireVerifiedEvidence = false) {
  const expected = new Set(expectedCategories);
  const eligibleFindings = requireVerifiedEvidence
    ? findings.filter(hasVerifiedClaimCodeEvidence)
    : findings;
  const detectedCategories = [
    ...new Set(eligibleFindings.map((finding) => finding.category).filter(Boolean)),
  ];
  const detected = new Set(detectedCategories);

  return {
    caseId,
    expectedCategories: [...expectedCategories],
    detectedCategories,
    truePositives: [...expected].filter((category) => detected.has(category))
      .length,
    falsePositives: [...detected].filter((category) => !expected.has(category))
      .length,
    falseNegatives: [...expected].filter((category) => !detected.has(category))
      .length,
    unsupportedHighSeverityFindings: findings.filter(
      (finding) =>
        finding.severity === "high"
        && (!expected.has(finding.category) || (requireVerifiedEvidence && !hasVerifiedClaimCodeEvidence(finding))),
    ).length,
  };
}

async function resolveCases() {
  const caseDocument = JSON.parse(await readFile(caseSourcePath, "utf8"));
  const resolved = [];

  for (const definition of caseDocument.cases) {
    const manuscript = definition.manuscriptPath
      ? await readFile(path.join(root, definition.manuscriptPath), "utf8")
      : definition.manuscript;
    const code = definition.codePath
      ? await readFile(path.join(root, definition.codePath), "utf8")
      : definition.code;

    resolved.push({ ...definition, manuscript, code });
  }

  return { caseDocument, cases: resolved };
}

export async function evaluateCachedFixtures() {
  const { caseDocument, cases } = await resolveCases();
  const outcomes = cases.map((definition) => {
    const detectedCategories = detectSeededFixtureCategories(definition);
    return scoreCase(
      definition.id,
      definition.expectedCategories,
      detectedCategories.map((category) => ({ category, severity: "seeded" })),
    );
  });

  return {
    schemaVersion: "second-lab.evaluation-scorecard.v1",
    evaluationMode: "cached-fixture-validation",
    liveModel: false,
    publishedOn: caseDocument.publishedOn,
    ...scoreOutcomes(outcomes),
    citationValidity: null,
    latencyMs: null,
    tokens: null,
    estimatedCostUsd: null,
    outcomes,
    disclosure:
      "This scorecard validates the seeded fixture labels with deterministic checks. It is not a GPT-5.6 model evaluation and includes no model latency, token, or cost measurements.",
  };
}

function parseReviewEvent(line) {
  const event = JSON.parse(line);
  if (event.event !== "review.completed" && event.type !== "review.completed") return null;
  return event.review ?? event.result ?? event.data?.review ?? event.data ?? null;
}

async function getAccessCookie(baseUrl) {
  if (process.env.EVAL_ACCESS_COOKIE) return process.env.EVAL_ACCESS_COOKIE;
  if (!process.env.EVAL_ACCESS_CODE) return null;

  const response = await fetch(new URL("/api/access", baseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: new URL(baseUrl).origin,
    },
    body: JSON.stringify({ code: process.env.EVAL_ACCESS_CODE }),
  });
  if (!response.ok) {
    throw new Error(`Judge access failed with HTTP ${response.status}`);
  }

  return response.headers.get("set-cookie")?.split(";", 1)[0] ?? null;
}

async function reviewLiveCase(baseUrl, definition, cookie) {
  const form = new FormData();
  form.append(
    "manuscript",
    new Blob([definition.manuscript], { type: "text/markdown" }),
    definition.manuscriptFileName,
  );
  form.append(
    "code",
    new Blob([definition.code], { type: "text/x-python" }),
    definition.codeFileName,
  );
  form.append("evaluationCaseId", definition.id);

  const startedAt = performance.now();
  const response = await fetch(new URL("/api/review", baseUrl), {
    method: "POST",
    headers: {
      origin: new URL(baseUrl).origin,
      ...(cookie ? { cookie } : {}),
    },
    body: form,
  });
  if (!response.ok) {
    throw new Error(
      `Live case ${definition.id} failed with HTTP ${response.status}`,
    );
  }

  const body = await response.text();
  let review = null;
  for (const line of body.split("\n").filter(Boolean)) {
    const completed = parseReviewEvent(line);
    if (completed) review = completed;
  }
  if (!review) {
    throw new Error(`Live case ${definition.id} did not emit review.completed`);
  }

  return { review, latencyMs: Math.round(performance.now() - startedAt) };
}

export async function evaluateLiveModel(baseUrl) {
  const { cases } = await resolveCases();
  const cookie = await getAccessCookie(baseUrl);
  const outcomes = [];
  const latencies = [];
  let inputTokens = 0;
  let outputTokens = 0;
  const inputCostPerMillion = Number(process.env.EVAL_INPUT_COST_PER_MILLION);
  const outputCostPerMillion = Number(process.env.EVAL_OUTPUT_COST_PER_MILLION);
  const hasPricing = Number.isFinite(inputCostPerMillion) && inputCostPerMillion >= 0
    && Number.isFinite(outputCostPerMillion) && outputCostPerMillion >= 0;
  let checkedUrls = 0;
  let validUrls = 0;

  for (const definition of cases) {
    const { review, latencyMs } = await reviewLiveCase(
      baseUrl,
      definition,
      cookie,
    );
    const findings = review.findings ?? [];
    outcomes.push(
      scoreCase(definition.id, definition.expectedCategories, findings, true),
    );
    latencies.push(latencyMs);

    inputTokens += review.provenance?.usage?.inputTokens ?? 0;
    outputTokens += review.provenance?.usage?.outputTokens ?? 0;
    for (const source of review.sources ?? []) {
      if (!source.url) continue;
      checkedUrls += 1;
      const nativeVerified =
        source.verification === "native-web" ||
        source.verification === "native-source" ||
        source.nativeSource === true;
      if (source.url.startsWith("https://") && nativeVerified) validUrls += 1;
    }
  }

  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  return {
    schemaVersion: "second-lab.evaluation-scorecard.v1",
    evaluationMode: "live-model",
    liveModel: true,
    publishedOn: new Date().toISOString().slice(0, 10),
    runAt: new Date().toISOString(),
    baseUrl,
    ...scoreOutcomes(outcomes),
    citationValidity:
      checkedUrls === 0 ? null : { valid: validUrls, checked: checkedUrls },
    latencyMs: {
      median: sortedLatencies[Math.floor(sortedLatencies.length / 2)] ?? null,
      total: latencies.reduce((total, latency) => total + latency, 0),
      perCase: latencies,
    },
    tokens: { input: inputTokens, output: outputTokens },
    estimatedCostUsd: hasPricing
      ? (inputTokens * inputCostPerMillion + outputTokens * outputCostPerMillion) / 1_000_000
      : null,
    pricingSource: hasPricing ? process.env.EVAL_PRICING_SOURCE || "Operator-supplied per-million token rates" : null,
    outcomes,
    disclosure:
      "This scorecard was produced by calling the configured live /api/review endpoint for all six seeded cases.",
  };
}

async function main() {
  const modeArgument = process.argv.find((argument) =>
    argument.startsWith("--mode="),
  );
  const mode = modeArgument?.split("=", 2)[1] ?? "cached";
  const outputArgument = process.argv.find((argument) =>
    argument.startsWith("--output="),
  );
  const outputPath = outputArgument
    ? path.resolve(root, outputArgument.split("=", 2)[1])
    : defaultOutputPath;

  let scorecard;
  if (mode === "cached") {
    scorecard = await evaluateCachedFixtures();
  } else if (mode === "live") {
    const baseUrl = process.env.EVAL_BASE_URL;
    if (!baseUrl) {
      throw new Error("EVAL_BASE_URL is required for --mode=live");
    }
    scorecard = await evaluateLiveModel(baseUrl);
  } else {
    throw new Error(`Unknown evaluation mode: ${mode}`);
  }

  await writeFile(outputPath, `${JSON.stringify(scorecard, null, 2)}\n`);
  process.stdout.write(
    `${scorecard.evaluationMode}: ${scorecard.truePositives}/${scorecard.seededFindingCount} seeded findings, ${scorecard.falsePositives} unsupported findings\n`,
  );
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (entryUrl === import.meta.url) {
  await main();
}
