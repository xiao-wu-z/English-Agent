import { z } from "zod";

export const voiceSessionHealthSchema = z.enum([
  "healthy",
  "degraded",
  "recovering",
  "fallback_text",
  "failed",
]);

export const voiceTimeoutTypeSchema = z.enum([
  "microphone_permission_timeout",
  "qwen_connect_timeout",
  "no_user_speech_timeout",
  "no_assistant_response_timeout",
  "sse_idle_timeout",
  "audio_send_timeout",
  "summary_timeout",
]);

export const voiceRecoveryActionSchema = z.enum([
  "retry_connect",
  "restart_sse",
  "flush_audio_queue",
  "fallback_to_text",
  "mark_session_failed",
  "save_partial_transcript",
  "show_safe_error",
]);

export const voiceRecoveryReasonSchema = z.enum([
  "microphone_permission_timeout",
  "qwen_connect_failed",
  "qwen_connect_timeout",
  "sse_disconnected",
  "sse_idle_timeout",
  "no_transcript_after_audio",
  "assistant_response_timeout",
  "event_parse_failed",
  "summary_failed",
  "unsupported_audio_format",
]);

export const voiceRecoveryEventSchema = z.object({
  sessionId: z.string().min(1),
  health: voiceSessionHealthSchema,
  action: voiceRecoveryActionSchema,
  reason: voiceRecoveryReasonSchema,
  createdAt: z.string().min(1),
  safeMessage: z.string().min(1),
}).strict();

export type VoiceSessionHealth = z.infer<typeof voiceSessionHealthSchema>;
export type VoiceTimeoutType = z.infer<typeof voiceTimeoutTypeSchema>;
export type VoiceRecoveryAction = z.infer<typeof voiceRecoveryActionSchema>;
export type VoiceRecoveryReason = z.infer<typeof voiceRecoveryReasonSchema>;
export type VoiceRecoveryEvent = z.infer<typeof voiceRecoveryEventSchema>;
