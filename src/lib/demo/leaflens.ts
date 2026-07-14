import leafLensReviewJson from "./leaflens-review.json";

export type LeafLensCachedReview = typeof leafLensReviewJson;

/**
 * Returns a fresh copy so request handlers and client state cannot mutate the
 * module-level prepared fixture for later visitors.
 */
export function getLeafLensCachedReview(): LeafLensCachedReview {
  return structuredClone(leafLensReviewJson);
}

export const leafLensFixtureVersion = leafLensReviewJson.fixtureVersion;
