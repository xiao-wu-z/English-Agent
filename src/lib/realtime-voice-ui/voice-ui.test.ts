import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyRealtimeEventToVoiceState,
  canTransitionVoiceState,
  getMediaRecorderFallback,
  shouldPersistAudioChunk,
  validateAudioChunk,
  decideRealtimeCorrectionDisplay,
} from "./index.ts";

const baseEvent = {
  id: "event-1",
  sessionId: "rt-session-1",
  providerName: "mock",
  modelName: "mock-realtime",
  createdAt: "2026-06-07T00:00:00.000Z",
};

describe("realtime voice UI logic", () => {
  it("validates voice state transitions", () => {
    assert.equal(canTransitionVoiceState("idle", "requesting_microphone"), true);
    assert.equal(canTransitionVoiceState("listening", "abandoned"), true);
    assert.equal(canTransitionVoiceState("completed", "listening"), false);
  });

  it("maps realtime provider events into UI state", () => {
    let state = applyRealtimeEventToVoiceState(
      { status: "connecting", messages: [], playbackQueue: [] },
      { ...baseEvent, type: "session.created" },
    );
    assert.equal(state.status, "listening");

    state = applyRealtimeEventToVoiceState(state, {
      ...baseEvent,
      id: "event-2",
      type: "transcript.user.partial",
      text: "I want",
    });
    assert.equal(state.userPartialTranscript, "I want");

    state = applyRealtimeEventToVoiceState(state, {
      ...baseEvent,
      id: "event-3",
      type: "transcript.assistant.final",
      text: "Could you say a little more?",
    });
    assert.equal(state.messages[0].content, "Could you say a little more?");
    assert.equal(state.status, "speaking");

    state = applyRealtimeEventToVoiceState(state, {
      ...baseEvent,
      id: "event-4",
      type: "audio.delta",
      audio: { encoding: "mock/base64", data: "abc" },
    });
    assert.equal(state.playbackQueue.length, 1);
  });

  it("coalesces transcript deltas into one pending message before finalizing it", () => {
    let state = applyRealtimeEventToVoiceState(
      { status: "listening", messages: [], playbackQueue: [] },
      {
        ...baseEvent,
        type: "transcript.user.partial",
        text: "Hel",
      },
    );
    state = applyRealtimeEventToVoiceState(state, {
      ...baseEvent,
      id: "event-2",
      type: "transcript.user.partial",
      text: "lo",
    });
    assert.equal(state.userPartialTranscript, "Hello");
    assert.equal(state.messages.length, 0);

    state = applyRealtimeEventToVoiceState(state, {
      ...baseEvent,
      id: "event-3",
      type: "transcript.user.final",
      text: "Hello!",
    });
    assert.equal(state.userPartialTranscript, undefined);
    assert.deepEqual(state.messages, [{ role: "user", content: "Hello!" }]);

    state = applyRealtimeEventToVoiceState(state, {
      ...baseEvent,
      id: "event-4",
      type: "transcript.assistant.partial",
      text: "How",
    });
    state = applyRealtimeEventToVoiceState(state, {
      ...baseEvent,
      id: "event-5",
      type: "transcript.assistant.partial",
      text: " are you?",
    });
    assert.equal(state.assistantPartialTranscript, "How are you?");
  });

  it("accepts cumulative transcript partials without duplicating text", () => {
    let state = applyRealtimeEventToVoiceState(
      { status: "listening", messages: [], playbackQueue: [] },
      {
        ...baseEvent,
        type: "transcript.user.partial",
        text: "Hello",
      },
    );
    state = applyRealtimeEventToVoiceState(state, {
      ...baseEvent,
      id: "event-2",
      type: "transcript.user.partial",
      text: "Hello world",
    });

    assert.equal(state.userPartialTranscript, "Hello world");
  });

  it("keeps audio chunks out of persisted history and handles recorder fallback", () => {
    assert.equal(shouldPersistAudioChunk(), false);
    assert.doesNotThrow(() => validateAudioChunk(new Uint8Array([1, 2, 3])));
    assert.throws(() => validateAudioChunk(new Uint8Array()), /audio_chunk_invalid/);
    assert.match(getMediaRecorderFallback(false), /文本练习/);
  });

  it("shows at most one Chinese high-confidence correction after final transcript", () => {
    assert.deepEqual(
      decideRealtimeCorrectionDisplay({
        uiStatus: "listening",
        transcriptFinal: true,
        corrections: [
          {
            explanation: "这里用 I'd like 更自然。",
            confidenceLabel: "high",
            riskLevel: "low",
          },
        ],
      }),
      { action: "defer_to_summary" },
    );

    const decision = decideRealtimeCorrectionDisplay({
      uiStatus: "thinking",
      transcriptFinal: true,
      corrections: [
        {
          explanation: "这里用 I'd like 更自然。",
          confidenceLabel: "high",
          riskLevel: "low",
        },
        {
          explanation: "第二条不应展示。",
          confidenceLabel: "high",
          riskLevel: "low",
        },
      ],
    });
    assert.equal(decision.action, "show");
    assert.match(decision.correction?.explanation ?? "", /更自然/);

    assert.equal(
      decideRealtimeCorrectionDisplay({
        uiStatus: "thinking",
        transcriptFinal: true,
        corrections: [
          {
            explanation: "低置信不展示。",
            confidenceLabel: "medium",
            riskLevel: "low",
          },
        ],
      }).action,
      "defer_to_summary",
    );
  });
});
