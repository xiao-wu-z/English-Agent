import type { RealtimeProviderEvent } from "../model-providers/realtime-types.ts";
import type { RealtimeApplicationEvent } from "./application-events.ts";

export function formatRealtimeSseEvent(
  event: RealtimeProviderEvent | RealtimeApplicationEvent,
): string {
  return `event: realtime.event\ndata: ${JSON.stringify(event)}\n\n`;
}

export function formatRealtimeSseHeartbeat(): string {
  return "event: realtime.heartbeat\ndata: {}\n\n";
}

export function createRealtimeSseResponse(
  stream: ReadableStream<Uint8Array>,
): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
