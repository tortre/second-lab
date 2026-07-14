import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { getSessionSigningSecret, isJudgeAccessRequired } from "./config";

export const ACCESS_COOKIE_NAME = "second_lab_session";
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

const TOKEN_VERSION = "v1";
const ALLOWED_CLOCK_SKEW_SECONDS = 60;

export type AccessSession = {
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
};

export type AccessDecision = {
  allowed: boolean;
  accessRequired: boolean;
  sessionId: string | null;
};

type TokenOptions = {
  now?: number;
  secret?: string | null;
};

function sign(unsignedToken: string, secret: string) {
  return createHmac("sha256", secret).update(unsignedToken).digest("base64url");
}

function equalSignatures(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export function accessCodesMatch(candidate: string, expected: string) {
  const candidateDigest = createHmac("sha256", "second-lab-access-code").update(candidate).digest();
  const expectedDigest = createHmac("sha256", "second-lab-access-code").update(expected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

export function createSessionToken(options: TokenOptions = {}) {
  const secret = options.secret ?? getSessionSigningSecret();
  if (!secret) return null;

  const issuedAt = Math.floor((options.now ?? Date.now()) / 1_000);
  const sessionId = randomBytes(24).toString("base64url");
  const unsignedToken = `${TOKEN_VERSION}.${sessionId}.${issuedAt}`;
  return `${unsignedToken}.${sign(unsignedToken, secret)}`;
}

export function verifySessionToken(token: string | null | undefined, options: TokenOptions = {}): AccessSession | null {
  if (!token) return null;
  const secret = options.secret ?? getSessionSigningSecret();
  if (!secret) return null;

  const [version, sessionId, issuedAtValue, signature, extra] = token.split(".");
  if (extra || version !== TOKEN_VERSION || !sessionId || !issuedAtValue || !signature) return null;
  if (!/^[A-Za-z0-9_-]{32}$/.test(sessionId)) return null;

  const issuedAt = Number(issuedAtValue);
  if (!Number.isSafeInteger(issuedAt) || issuedAt < 0) return null;

  const unsignedToken = `${version}.${sessionId}.${issuedAtValue}`;
  const expectedSignature = sign(unsignedToken, secret);
  if (!equalSignatures(signature, expectedSignature)) return null;

  const now = Math.floor((options.now ?? Date.now()) / 1_000);
  if (issuedAt > now + ALLOWED_CLOCK_SKEW_SECONDS) return null;
  if (now >= issuedAt + SESSION_TTL_SECONDS) return null;

  return {
    sessionId,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_SECONDS,
  };
}

export async function getAccessDecision(): Promise<AccessDecision> {
  if (!isJudgeAccessRequired()) {
    return { allowed: true, accessRequired: false, sessionId: "local-development" };
  }

  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(ACCESS_COOKIE_NAME)?.value);
  return {
    allowed: Boolean(session),
    accessRequired: true,
    sessionId: session?.sessionId ?? null,
  };
}
