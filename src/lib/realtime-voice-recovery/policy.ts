import type { VoiceTimeoutType } from "./schema.ts";

export const DEFAULT_VOICE_TIMEOUT_POLICY: Record<VoiceTimeoutType, number> = {
  microphone_permission_timeout: 15000,
  qwen_connect_timeout: 15000,
  no_user_speech_timeout: 20000,
  no_assistant_response_timeout: 30000,
  sse_idle_timeout: 45000,
  audio_send_timeout: 10000,
  summary_timeout: 30000,
};
