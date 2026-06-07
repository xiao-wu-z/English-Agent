import type { VoiceRecoveryReason, VoiceTimeoutType } from "./schema.ts";

export type VoiceRecoveryTimerRegistry = {
  start(key: VoiceTimeoutType, delayMs: number, callback: () => void): void;
  clear(key: VoiceTimeoutType): void;
  clearAll(): void;
};

export function mapTimeoutToRecoveryReason(
  timeoutType: VoiceTimeoutType,
): VoiceRecoveryReason {
  if (timeoutType === "no_assistant_response_timeout") {
    return "assistant_response_timeout";
  }
  if (timeoutType === "no_user_speech_timeout") {
    return "no_transcript_after_audio";
  }
  if (timeoutType === "audio_send_timeout") {
    return "unsupported_audio_format";
  }
  if (timeoutType === "summary_timeout") {
    return "summary_failed";
  }
  return timeoutType;
}

export function createVoiceRecoveryTimerRegistry(options: {
  setTimeout: (callback: () => void, delayMs: number) => unknown;
  clearTimeout: (id: unknown) => void;
}): VoiceRecoveryTimerRegistry {
  const timers = new Map<VoiceTimeoutType, unknown>();
  return {
    start(key, delayMs, callback) {
      this.clear(key);
      timers.set(key, options.setTimeout(callback, delayMs));
    },
    clear(key) {
      const timer = timers.get(key);
      if (timer === undefined) {
        return;
      }
      options.clearTimeout(timer);
      timers.delete(key);
    },
    clearAll() {
      for (const timer of timers.values()) {
        options.clearTimeout(timer);
      }
      timers.clear();
    },
  };
}
