import { createHash } from "node:crypto";

import type { EvidenceSource, ReviewResult, VerifiedAnchor } from "./review-types";

export type NativeSource = { title?: string; url: string };
export type ModelSource = { title: string; url: string; role: EvidenceSource["role"] };

export function canonicalHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    url.hash = "";
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return null;
  }
}

function sourceId(url: string) {
  return `src-${createHash("sha256").update(url).digest("hex").slice(0, 12)}`;
}

export function allowlistNativeSources(nativeSources: NativeSource[], modelSources: ModelSource[]): EvidenceSource[] {
  const nativeByUrl = new Map<string, NativeSource>();
  for (const source of nativeSources) {
    const url = canonicalHttpsUrl(source.url);
    if (url) nativeByUrl.set(url, source);
  }

  const accepted = new Map<string, EvidenceSource>();
  for (const candidate of modelSources) {
    const url = canonicalHttpsUrl(candidate.url);
    if (!url || !nativeByUrl.has(url)) continue;
    const native = nativeByUrl.get(url)!;
    accepted.set(url, {
      id: sourceId(url),
      title: native.title?.trim() || new URL(url).hostname,
      url,
      role: candidate.role,
      verification: "native-web",
    });
  }
  return [...accepted.values()];
}

export function makeCachedSource(source: Omit<EvidenceSource, "id" | "verification">): EvidenceSource {
  const url = canonicalHttpsUrl(source.url);
  if (!url) throw new Error("Cached evidence sources must use HTTPS.");
  return { ...source, url, id: sourceId(url), verification: "cached-fixture" };
}

export function verifyTextAnchor(text: string, anchor: VerifiedAnchor): VerifiedAnchor {
  if (!anchor.lineStart || !anchor.lineEnd || anchor.lineEnd < anchor.lineStart) {
    return { ...anchor, verification: "model-located" };
  }
  const lines = text.split(/\r?\n/);
  if (anchor.lineEnd > lines.length) return { ...anchor, verification: "model-located" };
  const selected = lines.slice(anchor.lineStart - 1, anchor.lineEnd).join("\n");
  return { ...anchor, verification: selected.includes(anchor.excerpt) ? "verified" : "model-located" };
}

export function verifyReviewAnchors(review: ReviewResult, files: Map<string, string>): ReviewResult {
  return {
    ...review,
    findings: review.findings.map((finding) => ({
      ...finding,
      anchors: finding.anchors.map((anchor) => {
        const text = files.get(anchor.fileName);
        return text === undefined ? { ...anchor, verification: "model-located" } : verifyTextAnchor(text, anchor);
      }),
    })),
  };
}

export function escapeMarkdown(value: string) {
  return value.replace(/([\\`*_{}\[\]()<>#+\-.!|])/g, "\\$1");
}

export function safeMarkdownUrl(value: string) {
  return canonicalHttpsUrl(value) ?? "https://invalid.example";
}

export function sha256Hex(bytes: ArrayBuffer | Uint8Array | string) {
  const hash = createHash("sha256");
  if (typeof bytes === "string") hash.update(bytes);
  else hash.update(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
  return hash.digest("hex");
}
