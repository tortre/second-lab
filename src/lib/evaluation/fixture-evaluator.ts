import casesJson from "./cases.json";

export const evaluationCategories = casesJson.categories;
export const evaluationCaseDefinitions = casesJson.cases;

export type EvaluationCategory = (typeof evaluationCategories)[number];

export type EvaluationInput = {
  manuscript: string;
  code: string;
};

export type CaseOutcome = {
  caseId: string;
  expectedCategories: string[];
  detectedCategories: string[];
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
};

export type CachedFixtureScorecard = {
  schemaVersion: "second-lab.evaluation-scorecard.v1";
  evaluationMode: "cached-fixture-validation";
  liveModel: false;
  publishedOn: string;
  caseCount: number;
  seededFindingCount: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  seededCategoryRecall: number;
  unsupportedFindingRate: number;
  flagshipDefectsDetected: number;
  flagshipDefectsExpected: number;
  cleanControlUnsupportedHighSeverityFindings: number;
  outcomes: CaseOutcome[];
  disclosure: string;
};

const baselineClaimPattern = /(?:outperform|better than|compared with)[\s\S]{0,120}baseline/i;
const baselineImplementationPattern =
  /(?:majority_(?:label|predictions?)|baseline\s*=|baseline\.fit|baseline_predictions?)/i;

/**
 * A deliberately small deterministic checker for validating that the seeded
 * fixtures contain the defects their labels say they contain. It is not the
 * AI reviewer and its output must never be reported as model performance.
 */
export function detectSeededFixtureCategories({
  manuscript,
  code,
}: EvaluationInput): string[] {
  const detected = new Set<string>();

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

  if (
    baselineClaimPattern.test(manuscript) &&
    !baselineImplementationPattern.test(code)
  ) {
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

  return evaluationCategories.filter((category) => detected.has(category));
}

export function buildCachedFixtureScorecard(
  inputsByCaseId: Readonly<Record<string, EvaluationInput>>,
): CachedFixtureScorecard {
  const outcomes = evaluationCaseDefinitions.map((definition) => {
    const input = inputsByCaseId[definition.id];
    if (!input) {
      throw new Error(`Missing fixture input for evaluation case: ${definition.id}`);
    }

    const expected = new Set<string>(definition.expectedCategories);
    const detectedCategories = detectSeededFixtureCategories(input);
    const detected = new Set(detectedCategories);

    return {
      caseId: definition.id,
      expectedCategories: [...definition.expectedCategories],
      detectedCategories,
      truePositives: [...expected].filter((category) => detected.has(category))
        .length,
      falsePositives: [...detected].filter((category) => !expected.has(category))
        .length,
      falseNegatives: [...expected].filter((category) => !detected.has(category))
        .length,
    } satisfies CaseOutcome;
  });

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
    schemaVersion: "second-lab.evaluation-scorecard.v1",
    evaluationMode: "cached-fixture-validation",
    liveModel: false,
    publishedOn: casesJson.publishedOn,
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
    cleanControlUnsupportedHighSeverityFindings: clean?.falsePositives ?? 0,
    outcomes,
    disclosure:
      "This scorecard validates the seeded fixture labels with deterministic checks. It is not a GPT-5.6 model evaluation and includes no model latency, token, or cost measurements.",
  };
}
