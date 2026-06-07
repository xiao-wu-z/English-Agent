import type {
  VoiceRecoveryAction,
  VoiceRecoveryReason,
  VoiceSessionHealth,
} from "./schema.ts";

export type VoiceRecoveryDecisionInput = {
  reason: VoiceRecoveryReason;
  attempts: number;
};

export type VoiceRecoveryDecision = {
  health: VoiceSessionHealth;
  action: VoiceRecoveryAction;
};

export function decideVoiceRecovery(
  input: VoiceRecoveryDecisionInput,
): VoiceRecoveryDecision {
  if (input.reason === "sse_disconnected" || input.reason === "sse_idle_timeout") {
    return input.attempts === 0
      ? { health: "recovering", action: "restart_sse" }
      : { health: "fallback_text", action: "fallback_to_text" };
  }
  if (input.reason === "qwen_connect_failed" || input.reason === "qwen_connect_timeout") {
    return input.attempts === 0
      ? { health: "recovering", action: "retry_connect" }
      : { health: "fallback_text", action: "fallback_to_text" };
  }
  if (input.reason === "assistant_response_timeout") {
    return { health: "fallback_text", action: "show_safe_error" };
  }
  if (
    input.reason === "no_transcript_after_audio" ||
    input.reason === "unsupported_audio_format"
  ) {
    return { health: "fallback_text", action: "fallback_to_text" };
  }
  if (input.reason === "event_parse_failed") {
    return { health: "degraded", action: "save_partial_transcript" };
  }
  if (input.reason === "summary_failed") {
    return { health: "degraded", action: "show_safe_error" };
  }
  return { health: "failed", action: "mark_session_failed" };
}
