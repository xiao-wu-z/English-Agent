import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { realtimeApplicationEventSchema } from "./application-events.ts";
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

  it("validates and formats correction application events", () => {
    const event = realtimeApplicationEventSchema.parse({
      id: "app-event-1",
      sessionId: "voice-session-1",
      createdAt: "2026-06-07T00:00:00.000Z",
      type: "correction.ready",
      correction: {
        id: "correction-1",
        turnId: "turn-1",
        type: "expression",
        original: "I want talk about weekend.",
        corrected: "I'd like talk about weekend.",
        explanation: "这里用 I'd like 会更自然。",
        severity: "medium",
        displayTiming: "after_turn",
        confidenceLabel: "high",
        action: "show",
      },
    });

    const message = formatRealtimeSseEvent(event);

    assert.match(message, /"type":"correction\.ready"/);
    assert.match(message, /"explanation":"这里用/);
  });

  it("keeps workflow errors safe and free of audio or secrets", () => {
    const event = realtimeApplicationEventSchema.parse({
      id: "app-event-2",
      sessionId: "voice-session-1",
      createdAt: "2026-06-07T00:00:00.000Z",
      type: "workflow.error",
      error: {
        code: "correction_failed",
        message: "本轮轻纠错暂时不可用。",
      },
    });

    assert.doesNotMatch(
      JSON.stringify(event),
      /audio|base64|authorization|api.?key|sk-/i,
    );
  });
});
