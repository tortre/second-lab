const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

function readBoolean(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return fallback;
}

export function isJudgeAccessRequired() {
  return Boolean(process.env.JUDGE_ACCESS_CODE?.trim());
}

export function isLiveReviewAvailable() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function isMultiAgentAvailable() {
  return isLiveReviewAvailable() && readBoolean(process.env.MULTI_AGENT_ENABLED, true);
}

export function getSessionSigningSecret() {
  const dedicatedSecret = process.env.SESSION_SIGNING_SECRET?.trim();
  if (dedicatedSecret) return dedicatedSecret;

  // The access code is already a server-side secret and is a safe signing-key
  // fallback for small demos. Production deployments should set the dedicated
  // secret so rotating the judge code does not invalidate active sessions.
  return process.env.JUDGE_ACCESS_CODE?.trim() || null;
}
