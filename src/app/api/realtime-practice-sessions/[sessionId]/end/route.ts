import { NextResponse } from "next/server";
import { endRealtimePracticeSession } from "@/lib/realtime-voice-flow/orchestrator.server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    return NextResponse.json(await endRealtimePracticeSession(sessionId));
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "realtime_end_failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 400 },
    );
  }
}
