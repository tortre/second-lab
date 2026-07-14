import { getCachedLeafLensReview } from "@/lib/leaflens-cached";
import { createLeafLensReviewFiles } from "@/lib/demo/leaflens-project";
import { LiveReviewUnavailableError, ReviewCancelledError, MAX_TOTAL_BYTES, runLiveReview } from "@/lib/review-engine";
import type { ReviewStreamEvent } from "@/lib/review-types";
import {
  acquireReviewLease,
  createSafetyIdentifier,
  getAccessDecision,
  isSameOriginRequest,
  type AccessDecision,
  type ReviewLease,
} from "@/lib/security";

export const runtime = "nodejs";
export const maxDuration = 270;

const encoder = new TextEncoder();
const MAX_MULTIPART_BYTES = MAX_TOTAL_BYTES + 256 * 1024;

class UploadBodyTooLargeError extends Error {}

async function readBoundedFormData(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_MULTIPART_BYTES) {
    throw new UploadBodyTooLargeError();
  }
  if (!request.body) throw new Error("The multipart upload has no body.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let tooLarge = false;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_MULTIPART_BYTES) {
      tooLarge = true;
      chunks.length = 0;
      continue;
    }
    if (!tooLarge) chunks.push(value);
  }
  if (tooLarge) throw new UploadBodyTooLargeError();

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Response(body, { headers: { "Content-Type": contentType } }).formData();
}

function eventLine(event: ReviewStreamEvent) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

function ndjsonResponse(stream: ReadableStream<Uint8Array>, status = 200) {
  return new Response(stream, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function singleEventResponse(event: ReviewStreamEvent, status: number) {
  return ndjsonResponse(new ReadableStream({
    start(controller) {
      controller.enqueue(eventLine(event));
      controller.close();
    },
  }), status);
}

function failure(code: string, message: string, status: number, withDemo = false) {
  return singleEventResponse({
    event: "review.failed",
    code,
    message,
    ...(withDemo ? { cachedDemoUrl: "/?demo=leaflens" } : {}),
  }, status);
}

function preparedStream() {
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ReviewStreamEvent) => {
        if (!cancelled) controller.enqueue(eventLine(event));
      };
      const review = getCachedLeafLensReview();
      send({ event: "review.started", reviewId: review.id, requestedMode: "prepared" });
      send({ event: "review.mode", mode: "cached-demo", detail: "Using the public, deterministic LeafLens fixture." });
      send({ event: "agent.started", agent: "/fixture/claim_code_mapper", role: "Cached claim/code evidence" });
      send({ event: "agent.completed", agent: "/fixture/claim_code_mapper", detail: "Loaded deterministically verified manuscript and code anchors." });
      for (const source of review.sources) send({ event: "source.found", agent: "/fixture", source });
      send({ event: "review.completed", review });
      if (!cancelled) controller.close();
    },
    cancel() {
      cancelled = true;
    },
  });
}

function liveReviewResponse(request: Request, input: {
  manuscript: File;
  codeFiles: File[];
  context?: string;
  requestedMode: "prepared" | "upload";
  access: AccessDecision & { sessionId: string };
  lease: ReviewLease;
}) {
  let cancelled = false;
  const reviewAbort = new AbortController();
  const abortFromRequest = () => reviewAbort.abort(request.signal.reason);
  if (request.signal.aborted) abortFromRequest();
  else request.signal.addEventListener("abort", abortFromRequest, { once: true });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const safeSend = async (event: ReviewStreamEvent) => {
        if (!cancelled && !reviewAbort.signal.aborted) controller.enqueue(eventLine(event));
      };
      const reviewId = `pending-${crypto.randomUUID()}`;
      try {
        await safeSend({ event: "review.started", reviewId, requestedMode: input.requestedMode });
        const review = await runLiveReview({
          manuscript: input.manuscript,
          codeFiles: input.codeFiles,
          context: input.context,
          safetyIdentifier: createSafetyIdentifier(input.access.sessionId),
          signal: reviewAbort.signal,
          onEvent: safeSend,
        });
        await safeSend({ event: "review.completed", review });
      } catch (cause) {
        if (!(cause instanceof ReviewCancelledError) && !reviewAbort.signal.aborted) {
          const unavailable = cause instanceof LiveReviewUnavailableError;
          await safeSend({
            event: "review.failed",
            code: unavailable ? "live-unavailable" : "live-review-failed",
            message: cause instanceof Error ? cause.message : "The live review failed.",
            cachedDemoUrl: "/?demo=leaflens",
          });
        }
      } finally {
        request.signal.removeEventListener("abort", abortFromRequest);
        input.lease.release();
        if (!cancelled && !reviewAbort.signal.aborted) controller.close();
      }
    },
    cancel() {
      cancelled = true;
      reviewAbort.abort(new ReviewCancelledError());
    },
  });
  return ndjsonResponse(stream);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return failure("origin-denied", "Request origin is not allowed.", 403);
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    if (body?.mode !== "prepared") return failure("invalid-request", "The prepared review request is invalid.", 400);
    return ndjsonResponse(preparedStream());
  }

  if (!contentType.includes("multipart/form-data")) {
    return failure("invalid-content-type", "Use a prepared JSON request or multipart upload.", 415);
  }
  const access = await getAccessDecision();
  if (!access.allowed || !access.sessionId) return failure("access-required", "Judge access is required for live review.", 401);
  const lease = acquireReviewLease(access.sessionId);
  if (!lease.acquired) return failure("review-in-progress", "This session already has a live review in progress.", 409);

  let formData: FormData;
  try {
    formData = await readBoundedFormData(request);
  } catch (cause) {
    lease.release();
    if (cause instanceof UploadBodyTooLargeError) {
      return failure("upload-too-large", "The manuscript and code files must total 4 MB or less.", 413);
    }
    return failure("malformed-upload", "The multipart upload could not be read.", 400);
  }
  const preparedLeafLens = formData.get("prepared") === "leaflens";
  const preparedFiles = preparedLeafLens ? createLeafLensReviewFiles() : null;
  const manuscriptEntry = formData.get("manuscript");
  const manuscript = preparedFiles?.manuscript ?? manuscriptEntry;
  const codeFiles = preparedFiles?.codeFiles ?? formData.getAll("code").filter((entry): entry is File => entry instanceof File);
  const contextEntry = formData.get("context");
  if (!(manuscript instanceof File)) {
    lease.release();
    return failure("missing-manuscript", "Add a manuscript before starting the review.", 400);
  }

  return liveReviewResponse(request, {
    manuscript,
    codeFiles,
    context: preparedFiles?.context ?? (typeof contextEntry === "string" ? contextEntry : undefined),
    requestedMode: preparedLeafLens ? "prepared" : "upload",
    access: { ...access, sessionId: access.sessionId },
    lease,
  });
}
