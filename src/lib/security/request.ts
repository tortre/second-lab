import { createHash } from "node:crypto";

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body is too large.");
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new RequestBodyTooLargeError();
  if (!request.body) throw new SyntaxError("Request body is missing.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new RequestBodyTooLargeError();
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function configuredOrigins() {
  return [
    process.env.ALLOWED_ORIGIN,
    process.env.APP_ORIGIN,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ]
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin));
}

function localDevelopmentOrigins(requestUrl: URL) {
  if (process.env.NODE_ENV === "production") return [];
  const port = requestUrl.port ? `:${requestUrl.port}` : "";
  return [`http://localhost${port}`, `http://127.0.0.1${port}`];
}

export function isSameOriginRequest(request: Request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = normalizeOrigin(requestUrl.origin);
  const suppliedOrigin = normalizeOrigin(request.headers.get("origin"));
  if (!requestOrigin || !suppliedOrigin) return false;

  const allowedOrigins = new Set([requestOrigin, ...configuredOrigins(), ...localDevelopmentOrigins(requestUrl)]);
  return allowedOrigins.has(suppliedOrigin);
}

export function createSafetyIdentifier(sessionId: string) {
  // Hash only a server-issued opaque identifier. Student content, filenames,
  // and manuscript excerpts must never be used to derive this value.
  return createHash("sha256").update(`second-lab/session/${sessionId}`, "utf8").digest("hex");
}
