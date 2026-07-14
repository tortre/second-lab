import { NextResponse } from "next/server";

import { runStudyAudit } from "@/lib/audit";
import { buildManuscriptReceipt, reviewManuscript } from "@/lib/agentic-review";
import { analyzeStudyWithModel } from "@/lib/model";
import { buildReceipt } from "@/lib/receipt";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const manuscript = formData.get("manuscript");
      const codeFiles = formData.getAll("code").filter((entry): entry is File => entry instanceof File);
      const contextEntry = formData.get("context");

      if (!(manuscript instanceof File)) {
        return NextResponse.json({ error: "Add a manuscript before starting the review." }, { status: 400 });
      }

      const review = await reviewManuscript({
        manuscript,
        codeFiles,
        context: typeof contextEntry === "string" ? contextEntry : undefined,
      });
      return NextResponse.json(
        { kind: "manuscript", review, receipt: buildManuscriptReceipt(review) },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The manuscript review failed.";
      const status = message.includes("OPENAI_API_KEY") ? 503 : message.includes("20 MB") || message.includes("8 MB") ? 413 : 400;
      return NextResponse.json({ error: message }, { status });
    }
  }

  const body = await request.json().catch(() => ({}));
  if (body?.mode !== "prepared") {
    return NextResponse.json({ error: "The review request is invalid." }, { status: 400 });
  }

  const audit = runStudyAudit();
  const analysis = await analyzeStudyWithModel(audit);
  const receipt = buildReceipt(audit, analysis);

  return NextResponse.json(
    { kind: "prepared", audit, analysis, receipt },
    { headers: { "Cache-Control": "no-store" } },
  );
}
