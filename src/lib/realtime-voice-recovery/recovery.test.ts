import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_VOICE_TIMEOUT_POLICY,
  createVoiceRecoveryBadcaseSignal,
  decideVoiceRecovery,
  getVoiceRecoveryMessage,
  voiceRecoveryActionSchema,
  voiceRecoveryEventSchema,
  voiceSessionHealthSchema,
  voiceTimeoutTypeSchema,
} from "./index.ts";

describe("realtime voice recovery policy", () => {
  it("validates finite health states, timeout types, and recovery actions", () => {
    assert.equal(voiceSessionHealthSchema.parse("fallback_text"), "fallback_text");
    assert.equal(voiceTimeoutTypeSchema.parse("qwen_connect_timeout"), "qwen_connect_timeout");
    assert.equal(voiceRecoveryActionSchema.parse("restart_sse"), "restart_sse");
    assert.throws(() => voiceRecoveryActionSchema.parse("retry_forever"));
  });

  it("uses explicit default timeout thresholds", () => {
    assert.deepEqual(DEFAULT_VOICE_TIMEOUT_POLICY, {
      microphone_permission_timeout: 15000,
      qwen_connect_timeout: 15000,
      no_user_speech_timeout: 20000,
      no_assistant_response_timeout: 30000,
      sse_idle_timeout: 45000,
      audio_send_timeout: 10000,
      summary_timeout: 30000,
    });
  });

  it("maps repeated failures to bounded recovery actions", () => {
    assert.deepEqual(
      decideVoiceRecovery({ reason: "sse_disconnected", attempts: 0 }),
      { health: "recovering", action: "restart_sse" },
    );
    assert.deepEqual(
      decideVoiceRecovery({ reason: "sse_disconnected", attempts: 2 }),
      { health: "fallback_text", action: "fallback_to_text" },
    );
    assert.deepEqual(
      decideVoiceRecovery({ reason: "qwen_connect_failed", attempts: 0 }),
      { health: "recovering", action: "retry_connect" },
    );
    assert.deepEqual(
      decideVoiceRecovery({ reason: "no_transcript_after_audio", attempts: 1 }),
      { health: "fallback_text", action: "fallback_to_text" },
    );
    assert.deepEqual(
      decideVoiceRecovery({ reason: "assistant_response_timeout", attempts: 0 }),
      { health: "fallback_text", action: "show_safe_error" },
    );
  });

  it("returns Chinese safe messages without secrets", () => {
    const message = getVoiceRecoveryMessage("qwen_connect_timeout");

    assert.match(message, /文本练习/);
    assert.doesNotMatch(message, /sk-|Authorization|API key|provider secret/i);
  });

  it("validates recovery event and badcase signal without raw audio or secrets", () => {
    const event = voiceRecoveryEventSchema.parse({
      sessionId: "voice-session-1",
      health: "fallback_text",
      action: "fallback_to_text",
      reason: "no_transcript_after_audio",
      createdAt: "2026-06-07T00:00:00.000Z",
      safeMessage: getVoiceRecoveryMessage("no_transcript_after_audio"),
    });
    const signal = createVoiceRecoveryBadcaseSignal(event);

    assert.equal(signal.kind, "voice_recovery");
    assert.match(signal.inputSnapshot, /no_transcript_after_audio/);
    assert.doesNotMatch(JSON.stringify(signal), /rawAudio|audioBytes|sk-|Authorization/i);
  });
});
