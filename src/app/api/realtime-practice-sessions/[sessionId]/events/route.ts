import { NextResponse } from "next/server";
import { getRealtimePracticeEvents } from "@/lib/realtime-voice-flow/orchestrator.server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    return NextResponse.json({ events: getRealtimePracticeEvents(sessionId) });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "realtime_events_failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 404 },
    );
  }
}
