import { NextResponse } from "next/server";
import { getTextPracticeSession } from "@/lib/text-practice-flow/orchestrator.server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const session = getTextPracticeSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: { code: "session_not_found", message: "Session not found" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ session });
}
