import { NextResponse } from "next/server";

import { isJudgeAccessRequired, isLiveReviewAvailable, isMultiAgentAvailable } from "../../../lib/security";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      liveReview: isLiveReviewAvailable(),
      multiAgent: isMultiAgentAvailable(),
      accessRequired: isJudgeAccessRequired(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
