import { NextResponse } from "next/server";
import { z } from "zod";

import { assessCoachAttempt } from "@/lib/coach";
import { coachAttemptSchema, evidenceFindingSchema, executionModeSchema } from "@/lib/review-types";
import { createSafetyIdentifier, getAccessDecision, isSameOriginRequest } from "@/lib/security";

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
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 32_000) return json({ error: "Coach request is too large." }, 413);
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Add both an explanation and a concrete revision plan." }, 400);

  const access = await getAccessDecision();
  const cached = parsed.data.reviewExecutionMode === "cached-demo";
  if (!cached && !access.allowed) return json({ error: "Judge access is required for live coaching." }, 401);
  const sessionId = access.sessionId ?? "public-cached-demo";
  try {
    const result = await assessCoachAttempt({
      ...parsed.data,
      safetyIdentifier: createSafetyIdentifier(sessionId),
      signal: request.signal,
    });
    return json(result);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "The coach could not assess this attempt.";
    return json({ error: message }, 502);
  }
}
