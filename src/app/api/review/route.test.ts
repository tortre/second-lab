import { afterEach, describe, expect, it, vi } from "vitest";

const reviewMocks = vi.hoisted(() => ({ runLiveReview: vi.fn() }));

vi.mock("@/lib/review-engine", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/review-engine")>();
  return { ...actual, runLiveReview: reviewMocks.runLiveReview };
});

import { POST } from "./route";

const originalAccessCode = process.env.JUDGE_ACCESS_CODE;
const originalApiKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  reviewMocks.runLiveReview.mockReset();
  if (originalAccessCode === undefined) delete process.env.JUDGE_ACCESS_CODE;
  else process.env.JUDGE_ACCESS_CODE = originalAccessCode;
  if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalApiKey;
});

describe("POST /api/review", () => {
  it("streams the public cached LeafLens review", async () => {
    delete process.env.JUDGE_ACCESS_CODE;
    delete process.env.OPENAI_API_KEY;
    const response = await POST(new Request("http://localhost/api/review", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ mode: "prepared" }),
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    const lines = (await response.text()).trim().split("\n").map((line) => JSON.parse(line));
    expect(lines.some((event) => event.event === "review.mode" && event.mode === "cached-demo")).toBe(true);
    const completed = lines.find((event) => event.event === "review.completed");
    expect(completed.review.findings.map((finding: { category: string }) => finding.category)).toEqual([
      "metric-mismatch",
      "data-leakage",
      "unsupported-baseline",
      "reproducibility",
    ]);
  });

  it("runs the prepared LeafLens package live when an allowed session and API key are available", async () => {
    delete process.env.JUDGE_ACCESS_CODE;
    process.env.OPENAI_API_KEY = "test-key";
    const cached = (await import("@/lib/leaflens-cached")).getCachedLeafLensReview();
    reviewMocks.runLiveReview.mockResolvedValue(cached);

    const form = new FormData();
    form.append("prepared", "leaflens");
    const response = await POST(new Request("http://localhost/api/review", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: form,
    }));
    const events = (await response.text()).trim().split("\n").map((line) => JSON.parse(line));
    expect(reviewMocks.runLiveReview).toHaveBeenCalledOnce();
    expect(reviewMocks.runLiveReview.mock.calls[0]?.[0].manuscript.name).toBe("student-paper.md");
    expect(reviewMocks.runLiveReview.mock.calls[0]?.[0].codeFiles[0].name).toBe("student-analysis.py");
    expect(events[0]).toMatchObject({ event: "review.started", requestedMode: "prepared" });
  });

  it("enforces origin and pre-buffer upload limits", async () => {
    const denied = await POST(new Request("http://localhost/api/review", {
      method: "POST",
      headers: { origin: "https://attacker.example", "content-type": "application/json" },
      body: JSON.stringify({ mode: "prepared" }),
    }));
    expect(denied.status).toBe(403);

    const oversized = await POST(new Request("http://localhost/api/review", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        "content-type": "multipart/form-data; boundary=test",
        "content-length": String(5 * 1024 * 1024),
      },
      body: "--test--",
    }));
    expect(oversized.status).toBe(413);
    expect(await oversized.text()).toContain("upload-too-large");

    const largeForm = new FormData();
    largeForm.append("manuscript", new File([new Uint8Array(4.5 * 1024 * 1024)], "paper.md"));
    const streamedOversized = await POST(new Request("http://localhost/api/review", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: largeForm,
    }));
    expect(streamedOversized.status).toBe(413);
  });

  it("aborts the underlying live review when the response stream is cancelled", async () => {
    delete process.env.JUDGE_ACCESS_CODE;
    let reviewSignal: AbortSignal | undefined;
    reviewMocks.runLiveReview.mockImplementation(async ({ signal }: { signal?: AbortSignal }) => {
      reviewSignal = signal;
      await new Promise<never>((_resolve, reject) => {
        signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
      });
    });

    const form = new FormData();
    form.append("manuscript", new File(["# paper"], "paper.md", { type: "text/markdown" }));
    const response = await POST(new Request("http://localhost/api/review", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: form,
    }));
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    await reader!.read();
    await reader!.cancel();
    expect(reviewSignal?.aborted).toBe(true);
  });
});
