import { NextResponse } from "next/server";
import {
  getRealtimePracticeEvents,
  subscribeRealtimePracticeEvents,
} from "@/lib/realtime-voice-flow/orchestrator.server";
import {
  createRealtimeSseResponse,
  formatRealtimeSseEvent,
} from "@/lib/realtime-voice-flow/sse";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const event of getRealtimePracticeEvents(sessionId)) {
          controller.enqueue(encoder.encode(formatRealtimeSseEvent(event)));
        }
        const unsubscribe = subscribeRealtimePracticeEvents(sessionId, (event) => {
          controller.enqueue(encoder.encode(formatRealtimeSseEvent(event)));
        });
        request.signal.addEventListener("abort", () => {
          unsubscribe();
          controller.close();
        }, { once: true });
      },
    });
    return createRealtimeSseResponse(stream);
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
