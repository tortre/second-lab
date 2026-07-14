import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildCachedFixtureScorecard,
  detectSeededFixtureCategories,
  evaluationCaseDefinitions,
  type EvaluationInput,
} from "./fixture-evaluator";

async function loadCaseInputs() {
  const inputs: Record<string, EvaluationInput> = {};

  for (const definition of evaluationCaseDefinitions) {
    inputs[definition.id] = {
      manuscript: definition.manuscriptPath
        ? await readFile(path.join(process.cwd(), definition.manuscriptPath), "utf8")
        : definition.manuscript ?? "",
      code: definition.codePath
        ? await readFile(path.join(process.cwd(), definition.codePath), "utf8")
        : definition.code ?? "",
    };
  }

  return inputs;
}

describe("six-case fixture evaluation", () => {
  it("defines the required six cases", () => {
    expect(evaluationCaseDefinitions.map((definition) => definition.id)).toEqual([
      "metric-mismatch",
      "data-leakage",
      "unsupported-baseline",
      "reproducibility",
      "mixed-defects",
      "clean-control",
    ]);
  });

  it("confirms the seeded defects and leaves the clean control clean", async () => {
    const inputs = await loadCaseInputs();

    for (const definition of evaluationCaseDefinitions) {
      expect(
        detectSeededFixtureCategories(inputs[definition.id]),
        definition.id,
      ).toEqual(definition.expectedCategories);
    }
  });

  it("labels its scorecard as cached fixture validation, never live model output", async () => {
    const scorecard = buildCachedFixtureScorecard(await loadCaseInputs());

    expect(scorecard.caseCount).toBe(6);
    expect(scorecard.liveModel).toBe(false);
    expect(scorecard.evaluationMode).toBe("cached-fixture-validation");
    expect(scorecard.seededCategoryRecall).toBe(1);
    expect(scorecard.unsupportedFindingRate).toBe(0);
    expect(scorecard.flagshipDefectsDetected).toBe(3);
    expect(scorecard.flagshipDefectsExpected).toBe(3);
    expect(scorecard.cleanControlUnsupportedHighSeverityFindings).toBe(0);
    expect(scorecard.disclosure).toMatch(/not a GPT-5\.6 model evaluation/i);
  });
});
