import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  type RealtimeModelProvider,
  type RealtimeProviderEvent,
  type RealtimeSession,
} from "../model-providers/realtime-types.ts";
import type { RealtimeApplicationEvent } from "./application-events.ts";
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
    this.emitFinalTranscript(sessionId, "Hello from PCM.", "provider-event-1");
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

  emitFinalTranscript(sessionId: string, text: string, id: string): void {
    for (const handler of this.handlers.get(sessionId) ?? []) {
      handler({
        id,
        sessionId,
        type: "transcript.user.final",
        providerName: this.name,
        modelName: this.modelName,
        createdAt: "2026-06-07T00:00:01.000Z",
        text,
      });
    }
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

  it("creates a linked skill session and exposes scenario metadata", async () => {
    const provider = new RecordingRealtimeProvider();
    const session = await createRealtimePracticeSession({
      scenarioId: "job-interview",
      provider,
    });

    assert.match(session.skillSessionId, /^session-/);
    assert.equal(session.scenario.titleZh, "求职面试");
    assert.equal(session.scenario.context.aiRole, "Interviewer");
  });

  it("processes a final transcript once and emits a correction application event", async () => {
    const provider = new RecordingRealtimeProvider();
    const session = await createRealtimePracticeSession({
      scenarioId: "daily-small-talk",
      provider,
    });
    const received: Array<RealtimeProviderEvent | RealtimeApplicationEvent> = [];
    subscribeRealtimePracticeEvents(session.id, (event) => received.push(event));

    provider.emitFinalTranscript(
      session.id,
      "I want talk about weekend.",
      "final-event-1",
    );
    provider.emitFinalTranscript(
      session.id,
      "I want talk about weekend.",
      "final-event-1",
    );
    await session.transcriptProcessing;

    const corrections = received.filter(
      (event) => event.type === "correction.ready",
    );
    assert.equal(corrections.length, 1);
    assert.match(
      corrections[0]?.type === "correction.ready"
        ? corrections[0].correction.explanation
        : "",
      /更自然/,
    );
  });

  it("waits for transcript processing and returns a structured report on end", async () => {
    const provider = new RecordingRealtimeProvider();
    const session = await createRealtimePracticeSession({
      scenarioId: "daily-small-talk",
      provider,
    });
    provider.emitFinalTranscript(
      session.id,
      "I want talk about weekend.",
      "final-event-1",
    );

    const ended = await endRealtimePracticeSession(session.id);

    assert.equal(ended.session.status, "completed");
    assert.equal(ended.scenario.id, "daily-small-talk");
    assert.equal(typeof ended.summary.overallScore, "number");
    assert.equal(ended.summary.correctedSentences.length, 1);
  });

  it("returns the stored report when end is requested more than once", async () => {
    const session = await createRealtimePracticeSession({
      scenarioId: "daily-small-talk",
    });

    const first = await endRealtimePracticeSession(session.id);
    const second = await endRealtimePracticeSession(session.id);

    assert.equal(second.summary.sessionId, first.summary.sessionId);
    assert.equal(second.summary.overallScore, first.summary.overallScore);
  });

  it("closes the session provider and records the closed event", async () => {
    const session = await createRealtimePracticeSession({
      scenarioId: "daily-small-talk",
    });

    const ended = await endRealtimePracticeSession(session.id);

    assert.equal(getRealtimePracticeEvents(session.id).at(-1)?.type, "session.closed");
    assert.equal(ended.session.status, "completed");
  });
});
