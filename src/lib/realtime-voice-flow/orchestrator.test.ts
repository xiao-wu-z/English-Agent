import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  type RealtimeModelProvider,
  type RealtimeProviderEvent,
  type RealtimeSession,
} from "../model-providers/realtime-types.ts";
import {
  createRealtimePracticeSession,
  endRealtimePracticeSession,
  getRealtimePracticeEvents,
  sendRealtimePracticeAudio,
  sendRealtimePracticeText,
  subscribeRealtimePracticeEvents,
} from "./orchestrator.server.ts";

class RecordingRealtimeProvider implements RealtimeModelProvider {
  name = "qwen";
  modelName = "qwen3.5-omni-plus-realtime";
  sentAudio: Uint8Array[] = [];
  private handlers = new Map<string, Set<(event: RealtimeProviderEvent) => void>>();

  async createSession(input: { sessionId?: string }): Promise<RealtimeSession> {
    return {
      id: input.sessionId ?? "recording-session-1",
      providerName: this.name,
      modelName: this.modelName,
      status: "active",
      createdAt: "2026-06-07T00:00:00.000Z",
    };
  }

  async sendText(): Promise<void> {}

  async sendAudioChunk(sessionId: string, chunk: Uint8Array): Promise<void> {
    this.sentAudio.push(chunk);
    for (const handler of this.handlers.get(sessionId) ?? []) {
      handler({
        id: "provider-event-1",
        sessionId,
        type: "transcript.user.final",
        providerName: this.name,
        modelName: this.modelName,
        createdAt: "2026-06-07T00:00:01.000Z",
        text: "Hello from PCM.",
      });
    }
  }

  async endSession(): Promise<void> {}

  onEvent(
    sessionId: string,
    handler: (event: RealtimeProviderEvent) => void,
  ): () => void {
    const handlers = this.handlers.get(sessionId) ?? new Set();
    handlers.add(handler);
    this.handlers.set(sessionId, handlers);
    return () => handlers.delete(handler);
  }
}

describe("realtime voice practice flow", () => {
  it("creates a mock realtime session and exposes normalized events", async () => {
    const session = await createRealtimePracticeSession({
      scenarioId: "daily-small-talk",
    });
    assert.equal(session.providerSession.providerName, "mock");

    await sendRealtimePracticeText({
      sessionId: session.id,
      text: "Hello voice practice.",
    });

    const eventTypes = getRealtimePracticeEvents(session.id).map((event) => event.type);
    assert.ok(eventTypes.includes("transcript.user.final"));
    assert.ok(eventTypes.includes("transcript.assistant.final"));
    assert.ok(eventTypes.includes("audio.delta"));
  });

  it("rejects empty audio chunks", async () => {
    const session = await createRealtimePracticeSession({
      scenarioId: "daily-small-talk",
    });
    await assert.rejects(
      () => sendRealtimePracticeAudio({
        sessionId: session.id,
        chunk: new Uint8Array(),
        metadata: {
          mimeType: "audio/webm;codecs=opus",
          sequence: 0,
          byteLength: 0,
        },
      }),
      /audio_encoding_failed/,
    );
  });

  it("rejects unsupported audio MIME type before provider forwarding", async () => {
    const session = await createRealtimePracticeSession({
      scenarioId: "daily-small-talk",
    });

    await assert.rejects(
      () => sendRealtimePracticeAudio({
        sessionId: session.id,
        chunk: new Uint8Array([1, 2, 3]),
        metadata: {
          mimeType: "audio/mp4",
          sequence: 0,
          byteLength: 3,
        },
      }),
      /unsupported_audio_format/,
    );
  });

  it("forwards PCM audio to the session provider and stores normalized provider events", async () => {
    const provider = new RecordingRealtimeProvider();
    const session = await createRealtimePracticeSession({
      scenarioId: "daily-small-talk",
      provider,
    });

    await sendRealtimePracticeAudio({
      sessionId: session.id,
      chunk: new Uint8Array([1, 2, 3]),
      metadata: {
        mimeType: "audio/pcm;rate=16000",
        sequence: 0,
        byteLength: 3,
        sampleRate: 16000,
        channels: 1,
      },
    });

    assert.equal(provider.sentAudio.length, 1);
    assert.equal(getRealtimePracticeEvents(session.id).at(-1)?.text, "Hello from PCM.");
  });

  it("fans out provider events to realtime subscribers", async () => {
    const provider = new RecordingRealtimeProvider();
    const session = await createRealtimePracticeSession({
      scenarioId: "daily-small-talk",
      provider,
    });
    const received: RealtimeProviderEvent[] = [];
    const unsubscribe = subscribeRealtimePracticeEvents(session.id, (event) => {
      received.push(event);
    });

    await sendRealtimePracticeAudio({
      sessionId: session.id,
      chunk: new Uint8Array([1, 2, 3]),
      metadata: {
        mimeType: "audio/pcm;rate=16000",
        sequence: 0,
        byteLength: 3,
        sampleRate: 16000,
        channels: 1,
      },
    });
    unsubscribe();

    assert.equal(received.at(-1)?.text, "Hello from PCM.");
  });

  it("closes the session provider and records the closed event", async () => {
    const session = await createRealtimePracticeSession({
      scenarioId: "daily-small-talk",
    });

    await endRealtimePracticeSession(session.id);

    assert.equal(getRealtimePracticeEvents(session.id).at(-1)?.type, "session.closed");
  });
});
