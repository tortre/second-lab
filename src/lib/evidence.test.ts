import { describe, expect, it } from "vitest";

import { allowlistNativeSources, canonicalHttpsUrl, escapeMarkdown, verifyTextAnchor } from "./evidence";
import { verifiedAnchorSchema } from "./review-types";

describe("evidence boundaries", () => {
  it("keeps only HTTPS URLs returned by native web search", () => {
    const sources = allowlistNativeSources(
      [{ title: "Allowed", url: "https://example.org/paper#results" }, { url: "http://example.org/plain" }],
      [
        { title: "Allowed", url: "https://example.org/paper", role: "method" },
        { title: "Invented", url: "https://invented.example/paper", role: "prior-work" },
        { title: "Plain", url: "http://example.org/plain", role: "dataset" },
      ],
    );

    expect(sources).toHaveLength(1);
    expect(sources[0]?.url).toBe("https://example.org/paper");
    expect(sources[0]?.title).toBe("Allowed");
    expect(canonicalHttpsUrl("javascript:alert(1)")).toBeNull();

    const withoutNativeTitle = allowlistNativeSources(
      [{ url: "https://example.org/method" }],
      [{ title: "Invented source label", url: "https://example.org/method", role: "method" }],
    );
    expect(withoutNativeTitle[0]?.title).toBe("example.org");
  });

  it("deterministically verifies exact file and line excerpts", () => {
    const verified = verifyTextAnchor("one\ntwo = accuracy_score(y, p)\nthree", {
      kind: "code",
      fileName: "train.py",
      locator: "model supplied a conflicting location",
      excerpt: "accuracy_score(y, p)",
      lineStart: 2,
      lineEnd: 2,
      verification: "model-located",
    });
    expect(verified.verification).toBe("verified");
    expect(verified.locator).toBe("train.py:2");
    expect(verifyTextAnchor("other", verified).verification).toBe("model-located");
    expect(verifyTextAnchor("one\ntwo = accuracy_score(y, p)\nthree", {
      ...verified,
      locator: "train.py:999",
      lineStart: 999,
      lineEnd: 999,
    }).verification).toBe("model-located");
    expect(verifyTextAnchor("one\ntwo = accuracy_score(y, p)\nthree", {
      ...verified,
      lineStart: undefined,
      lineEnd: undefined,
      section: "Evaluation",
    }).verification).toBe("model-located");
  });

  it("rejects empty or token-sized evidence excerpts", () => {
    expect(verifiedAnchorSchema.safeParse({
      kind: "code",
      fileName: "train.py",
      locator: "train.py:2",
      excerpt: "x",
      lineStart: 2,
      lineEnd: 2,
      verification: "model-located",
    }).success).toBe(false);
  });

  it("escapes model text before rendering Markdown receipts", () => {
    expect(escapeMarkdown("[claim](https://bad) *bold* # heading")).toBe(
      "\\[claim\\]\\(https://bad\\) \\*bold\\* \\# heading",
    );
  });
});
