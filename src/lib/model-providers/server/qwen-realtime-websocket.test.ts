import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeQwenRealtimeEvent,
  QwenRealtimeWebSocketProvider,
  resolveQwenRealtimeConfig,
} from "./qwen-realtime-websocket.ts";

class FakeQwenSocket {
  static OPEN = 1;
  readyState = FakeQwenSocket.OPEN;
  sent: string[] = [];
  listeners = new Map<string, Array<(value?: unknown) => void>>();
  readonly url: string;
  readonly options: { headers?: Record<string, string> };

  constructor(
    url: string,
    options: { headers?: Record<string, string> },
  ) {
    this.url = url;
    this.options = options;
  }

  on(eventName: string, listener: (value?: unknown) => void): this {
    const listeners = this.listeners.get(eventName) ?? [];
    listeners.push(listener);
    this.listeners.set(eventName, listeners);
    return this;
  }

  send(payload: string): void {
    this.sent.push(payload);
  }

  close(): void {
    this.emit("close");
  }

  emit(eventName: string, value?: unknown): void {
    for (const listener of this.listeners.get(eventName) ?? []) {
      listener(value);
    }
  }
}

describe("qwen realtime websocket provider", () => {
  it("resolves endpoint, model defaults, and keeps API key out of public config", () => {
    const config = resolveQwenRealtimeConfig({
      DASHSCOPE_API_KEY: "sk-test-secret",
    });

    assert.equal(config.modelName, "qwen3.5-omni-plus-realtime");
    assert.equal(
      config.url,
      "wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=qwen3.5-omni-plus-realtime",
    );
    assert.doesNotMatch(JSON.stringify(config.publicConfig), /sk-test-secret|Authorization/);
  });

  it("normalizes Qwen transcript and audio events into provider events", () => {
    const base = {
      sessionId: "voice-session-1",
      providerName: "qwen",
      modelName: "qwen3.5-omni-plus-realtime",
    };

    assert.deepEqual(
      normalizeQwenRealtimeEvent(
        {
          event_id: "event-user-partial",
          type: "conversation.item.input_audio_transcription.delta",
          text: "I would",
          stash: " like",
        },
        base,
      )?.type,
      "transcript.user.partial",
    );
    assert.equal(
      normalizeQwenRealtimeEvent(
        {
          event_id: "event-user-final",
          type: "conversation.item.input_audio_transcription.completed",
          transcript: "I would like coffee.",
        },
        base,
      )?.text,
      "I would like coffee.",
    );
    assert.deepEqual(
      normalizeQwenRealtimeEvent(
        {
          event_id: "event-audio",
          type: "response.audio.delta",
          delta: "YXVkaW8=",
        },
        base,
      )?.audio,
      { encoding: "pcm/base64", data: "YXVkaW8=" },
    );
    assert.equal(
      normalizeQwenRealtimeEvent(
        {
          event_id: "event-assistant-final",
          type: "response.audio_transcript.done",
          transcript: "Sure, here is a natural version.",
        },
        base,
      )?.type,
      "transcript.assistant.final",
    );
    assert.equal(normalizeQwenRealtimeEvent({ type: "unknown.event" }, base), null);
  });

  it("opens Qwen websocket with Authorization header and sends session update plus PCM audio append", async () => {
    let socket: FakeQwenSocket | null = null;
    const provider = new QwenRealtimeWebSocketProvider({
      env: {
        DASHSCOPE_API_KEY: "sk-test-secret",
      },
      socketFactory: (url, options) => {
        socket = new FakeQwenSocket(url, options);
        queueMicrotask(() => socket?.emit("open"));
        return socket;
      },
    });

    const events: string[] = [];
    const session = await provider.createSession({
      scenarioId: "daily-small-talk",
      sessionId: "voice-session-1",
      instructions: "You are a new acquaintance in a friendly community chat.",
    });
    provider.onEvent(session.id, (event) => events.push(event.type));
    await provider.sendAudioChunk(session.id, new Uint8Array([1, 2, 3]));
    socket?.emit(
      "message",
      JSON.stringify({
        event_id: "event-user-final",
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "Hello.",
      }),
    );

    assert.equal(socket?.options.headers?.Authorization, "Bearer sk-test-secret");
    assert.ok(socket?.sent.some((payload) => payload.includes("\"type\":\"session.update\"")));
    assert.ok(socket?.sent.some((payload) => payload.includes("new acquaintance")));
    assert.deepEqual(JSON.parse(socket?.sent.at(-1) ?? "{}"), {
      type: "input_audio_buffer.append",
      audio: "AQID",
    });
    assert.deepEqual(events, ["transcript.user.final"]);
    assert.doesNotMatch(JSON.stringify(events), /sk-test-secret|Authorization/);
  });
});
