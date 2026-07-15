import { NextResponse } from "next/server";
import { z } from "zod";

import { assessCoachAttempt } from "@/lib/coach";
import { getCachedLeafLensReview } from "@/lib/leaflens-cached";
import { coachAttemptSchema, evidenceFindingSchema, executionModeSchema } from "@/lib/review-types";
import { createSafetyIdentifier, getAccessDecision, isSameOriginRequest, readBoundedJson, RequestBodyTooLargeError } from "@/lib/security";

export const runtime = "nodejs";
export const maxDuration = 30;

const requestSchema = z.object({
  finding: evidenceFindingSchema,
  priorAttempts: z.array(coachAttemptSchema).max(2),
  diagnosis: z.string().trim().min(8).max(2400),
  revisionPlan: z.string().trim().min(8).max(2400),
  reviewExecutionMode: executionModeSchema,
});

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return json({ error: "Request origin is not allowed." }, 403);
  let body: unknown;
  try {
    body = await readBoundedJson(request, 32_000);
  } catch (cause) {
    if (cause instanceof RequestBodyTooLargeError) return json({ error: "Coach request is too large." }, 413);
    body = null;
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Add both an explanation and a concrete revision plan." }, 400);

  const cachedFinding = parsed.data.reviewExecutionMode === "cached-demo"
    ? getCachedLeafLensReview().findings.find((finding) => finding.id === parsed.data.finding.id)
    : undefined;
  const access = cachedFinding ? null : await getAccessDecision();
  if (!cachedFinding && !access?.allowed) return json({ error: "Judge access is required for live coaching." }, 401);
  const sessionId = cachedFinding ? "public-cached-demo" : access?.sessionId ?? "authorized-live-coach";
  try {
    const result = await assessCoachAttempt({
      ...parsed.data,
      finding: cachedFinding ?? parsed.data.finding,
      forceCached: Boolean(cachedFinding),
      safetyIdentifier: createSafetyIdentifier(sessionId),
      signal: request.signal,
    });
    return json(result);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "The coach could not assess this attempt.";
    return json({ error: message }, 502);
  }
}
