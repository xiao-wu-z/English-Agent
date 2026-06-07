import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RealtimeProviderError,
  realtimeProviderEventSchema,
  realtimeSessionSchema,
} from "./realtime-types.ts";
import {
  MockRealtimeProvider,
  resolveRealtimeProvider,
} from "./server/realtime-index.ts";

describe("realtime model providers", () => {
  it("validates realtime session and event schemas", () => {
    const session = realtimeSessionSchema.parse({
      id: "realtime-session-1",
      providerName: "mock",
      modelName: "mock-realtime",
      status: "active",
      createdAt: "2026-06-07T00:00:00.000Z",
    });
    assert.equal(session.status, "active");

    const event = realtimeProviderEventSchema.parse({
      id: "event-1",
      sessionId: session.id,
      type: "transcript.assistant.final",
      providerName: "mock",
      modelName: "mock-realtime",
      createdAt: "2026-06-07T00:00:01.000Z",
      text: "Could you tell me more?",
    });
    assert.equal(event.text, "Could you tell me more?");
  });

  it("resolves mock by default and emits deterministic transcript events", async () => {
    const provider = resolveRealtimeProvider({});
    assert.equal(provider.name, "mock");

    const session = await provider.createSession({ scenarioId: "daily-small-talk" });
    const events: Array<{ type: string; text?: string }> = [];
    const unsubscribe = provider.onEvent(session.id, (event) => events.push(event));
    await provider.sendText(session.id, "Hello there.");
    await provider.endSession(session.id);
    unsubscribe();

    assert.deepEqual(
      events.map((event) => event.type),
      [
        "transcript.user.final",
        "transcript.assistant.final",
        "audio.delta",
        "session.closed",
      ],
    );
    assert.equal(events[0].text, "Hello there.");
  });

  it("rejects invalid audio chunks and missing qwen key safely", async () => {
    const provider = new MockRealtimeProvider();
    const session = await provider.createSession({ scenarioId: "daily-small-talk" });
    await assert.rejects(
      () => provider.sendAudioChunk(session.id, new Uint8Array()),
      /audio_chunk_invalid/,
    );

    assert.throws(
      () => resolveRealtimeProvider({ MODEL_PROVIDER: "qwen" }),
      (error) =>
        error instanceof RealtimeProviderError &&
        error.code === "missing_api_key" &&
        !error.message.includes("sk-") &&
        !error.message.includes("Authorization"),
    );
    assert.throws(
      () => resolveRealtimeProvider({ MODEL_PROVIDER: "unknown" }),
      /unsupported_provider/,
    );
  });

  it("resolves real qwen realtime websocket provider when explicitly configured", () => {
    const provider = resolveRealtimeProvider({
      MODEL_PROVIDER: "qwen",
      DASHSCOPE_API_KEY: "sk-test-secret",
    });

    assert.equal(provider.name, "qwen");
    assert.equal(provider.modelName, "qwen3.5-omni-plus-realtime");
    assert.equal(provider.constructor.name, "QwenRealtimeWebSocketProvider");
    assert.doesNotMatch(JSON.stringify(provider), /sk-test-secret|Authorization/);
  });
});
