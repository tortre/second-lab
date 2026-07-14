import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getLeafLensCachedReview } from "./leaflens";

const fixtureDirectory = path.join(
  process.cwd(),
  "public/papers/leaflens",
);

describe("LeafLens cached review", () => {
  it("contains the three flagship confirmed defects without confidence scores", () => {
    const review = getLeafLensCachedReview();
    const confirmed = review.findings.filter(
      (finding) => finding.status === "confirmed",
    );

    expect(confirmed.map((finding) => finding.category)).toEqual([
      "metric-mismatch",
      "data-leakage",
      "unsupported-baseline",
    ]);
    expect(JSON.stringify(review)).not.toMatch(/confidence/i);
    expect(JSON.stringify(review)).not.toMatch(/transformer|sqrt\(d_model\)/i);
  });

  it("keeps every external fixture source on HTTPS", () => {
    const review = getLeafLensCachedReview();
    const externalSources = review.sources.filter(
      (source) => source.kind === "external",
    );

    expect(externalSources.length).toBeGreaterThan(0);
    expect(
      externalSources.every((source) => source.url?.startsWith("https://")),
    ).toBe(true);
    expect(
      externalSources.every(
        (source) => source.verification === "fixture-curated",
      ),
    ).toBe(true);
  });

  it("deterministically verifies every manuscript and code line anchor", async () => {
    const review = getLeafLensCachedReview();
    const contents = new Map<string, string>();

    for (const fileName of new Set(
      review.anchors.map((anchor) => anchor.fileName),
    )) {
      contents.set(
        fileName,
        await readFile(path.join(fixtureDirectory, fileName), "utf8"),
      );
    }

    for (const anchor of review.anchors) {
      const content = contents.get(anchor.fileName);
      expect(content, anchor.fileName).toBeDefined();
      const actualExcerpt = content
        ?.split("\n")
        .slice(anchor.lineStart - 1, anchor.lineEnd)
        .join("\n");
      expect(actualExcerpt, anchor.id).toBe(anchor.excerpt);
      expect(anchor.verification).toBe("verified");
    }
  });

  it("references only declared anchors and sources", () => {
    const review = getLeafLensCachedReview();
    const anchorIds = new Set(review.anchors.map((anchor) => anchor.id));
    const sourceIds = new Set(review.sources.map((source) => source.id));

    for (const finding of review.findings) {
      expect(
        finding.anchorIds.every((anchorId) => anchorIds.has(anchorId)),
      ).toBe(true);
      expect(
        finding.sourceIds.every((sourceId) => sourceIds.has(sourceId)),
      ).toBe(true);
    }
  });
});
