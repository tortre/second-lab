import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE_NAME,
  RequestBodyTooLargeError,
  SESSION_TTL_SECONDS,
  accessCodesMatch,
  createSessionToken,
  isAccessConfigurationSecure,
  isJudgeAccessRequired,
  isSameOriginRequest,
  readBoundedJson,
} from "../../../lib/security";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 4_096;

function noStoreJson(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return noStoreJson({ error: "Request origin is not allowed." }, 403);
  }

  const expectedCode = process.env.JUDGE_ACCESS_CODE?.trim();
  if (!isJudgeAccessRequired() || !expectedCode) {
    return noStoreJson({ ok: true, accessRequired: false });
  }
  if (!isAccessConfigurationSecure()) {
    return noStoreJson({ error: "Access is temporarily unavailable." }, 503);
  }

  let body: unknown;
  try {
    body = await readBoundedJson(request, MAX_REQUEST_BYTES);
  } catch (cause) {
    if (cause instanceof RequestBodyTooLargeError) return noStoreJson({ error: "Access request is too large." }, 413);
    body = null;
  }
  const candidate = body && typeof body === "object" && "code" in body && typeof body.code === "string"
    ? body.code
    : "";
  if (!candidate || candidate.length > 256 || !accessCodesMatch(candidate, expectedCode)) {
    return noStoreJson({ error: "The access code is invalid." }, 401);
  }

  const token = createSessionToken();
  if (!token) {
    return noStoreJson({ error: "Access is temporarily unavailable." }, 503);
  }

  const response = noStoreJson({
    ok: true,
    accessRequired: true,
    expiresInSeconds: SESSION_TTL_SECONDS,
  });
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    priority: "high",
  });
  return response;
}
