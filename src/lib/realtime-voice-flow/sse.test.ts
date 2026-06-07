import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createRealtimeSseResponse,
  formatRealtimeSseEvent,
  formatRealtimeSseHeartbeat,
} from "./sse.ts";

describe("realtime voice SSE formatting", () => {
  it("formats normalized provider events as SSE messages", () => {
    const message = formatRealtimeSseEvent({
      id: "event-1",
      sessionId: "voice-session-1",
      type: "transcript.user.final",
      providerName: "qwen",
      modelName: "qwen3.5-omni-plus-realtime",
      createdAt: "2026-06-07T00:00:00.000Z",
      text: "Hello.",
    });

    assert.match(message, /^event: realtime\.event\n/);
    assert.match(message, /\ndata: /);
    assert.match(message, /\n\n$/);
    assert.doesNotMatch(message, /Authorization|sk-/);
  });

  it("returns event-stream headers from the SSE response helper", async () => {
    const response = createRealtimeSseResponse(new ReadableStream());

    assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/);
    await response.body?.cancel();
  });

  it("formats heartbeat events that browser clients can observe", () => {
    assert.equal(
      formatRealtimeSseHeartbeat(),
      "event: realtime.heartbeat\ndata: {}\n\n",
    );
  });
});
