import { NextResponse } from "next/server";
import { endRealtimePracticeSession } from "@/lib/realtime-voice-flow/orchestrator.server";
import { toVoicePracticeScenario } from "@/lib/voice-practice-client";

export async function POST(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const result = await endRealtimePracticeSession(sessionId);
    return NextResponse.json({
      ...result,
      scenario: toVoicePracticeScenario(result.scenario),
    });
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
