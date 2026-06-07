import { NextResponse } from "next/server";
import {
  getRealtimePracticeEvents,
  subscribeRealtimePracticeEvents,
} from "@/lib/realtime-voice-flow/orchestrator.server";
import {
  createRealtimeSseResponse,
  formatRealtimeSseEvent,
  formatRealtimeSseHeartbeat,
} from "@/lib/realtime-voice-flow/sse";

const SSE_HEARTBEAT_INTERVAL_MS = 15_000;

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let closed = false;
        for (const event of getRealtimePracticeEvents(sessionId)) {
          controller.enqueue(encoder.encode(formatRealtimeSseEvent(event)));
        }
        const unsubscribe = subscribeRealtimePracticeEvents(sessionId, (event) => {
          if (closed) {
            return;
          }
          controller.enqueue(encoder.encode(formatRealtimeSseEvent(event)));
        });
        const heartbeatId = setInterval(() => {
          if (!closed) {
            controller.enqueue(encoder.encode(formatRealtimeSseHeartbeat()));
          }
        }, SSE_HEARTBEAT_INTERVAL_MS);
        request.signal.addEventListener("abort", () => {
          closed = true;
          clearInterval(heartbeatId);
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
