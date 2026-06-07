import { NextResponse } from "next/server";
import { createRealtimePracticeSession } from "@/lib/realtime-voice-flow/orchestrator.server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await createRealtimePracticeSession({
      scenarioId: String(body.scenarioId ?? ""),
    });
    return NextResponse.json({
      session: {
        id: session.id,
        scenarioId: session.scenarioId,
        providerSession: session.providerSession,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "realtime_session_create_failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 400 },
    );
  }
}
