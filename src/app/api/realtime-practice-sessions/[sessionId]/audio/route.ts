import { NextResponse } from "next/server";
import {
  sendRealtimePracticeAudio,
  sendRealtimePracticeText,
} from "@/lib/realtime-voice-flow/orchestrator.server";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const events = await sendRealtimePracticeText({
        sessionId,
        text: String(body.text ?? "Hello, this is a mock voice turn."),
      });
      return NextResponse.json({ accepted: true, events });
    }
    const bytes = new Uint8Array(await request.arrayBuffer());
    const result = await sendRealtimePracticeAudio({ sessionId, chunk: bytes });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "realtime_audio_failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 400 },
    );
  }
}
