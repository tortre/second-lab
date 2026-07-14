import { reviewResultSchema, type ReviewStreamEvent } from "./review-types";

export function parseReviewEventLine(line: string): ReviewStreamEvent {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    throw new Error("The review stream returned malformed JSON.");
  }
  if (!value || typeof value !== "object" || !("event" in value) || typeof value.event !== "string") {
    throw new Error("The review stream returned an invalid event.");
  }
  if (value.event === "review.completed" && "review" in value) {
    return { event: "review.completed", review: reviewResultSchema.parse(value.review) };
  }
  const allowed = new Set([
    "review.started",
    "review.mode",
    "agent.started",
    "source.found",
    "agent.completed",
    "review.failed",
  ]);
  if (!allowed.has(value.event)) throw new Error(`Unknown review event: ${value.event}`);
  return value as ReviewStreamEvent;
}

export async function readReviewStream(
  response: Response,
  onEvent: (event: ReviewStreamEvent) => void,
  signal?: AbortSignal,
) {
  if (!response.body) throw new Error("The review service returned no stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    if (signal?.aborted) {
      await reader.cancel();
      throw new DOMException("Cancelled", "AbortError");
    }
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.trim()) onEvent(parseReviewEventLine(line));
    if (done) break;
  }
  if (buffer.trim()) onEvent(parseReviewEventLine(buffer));
}
