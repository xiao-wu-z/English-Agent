import type { VoiceRecoveryEvent } from "./schema.ts";

export type VoiceRecoveryBadcaseSignal = {
  kind: "voice_recovery";
  sessionId: string;
  reason: VoiceRecoveryEvent["reason"];
  action: VoiceRecoveryEvent["action"];
  inputSnapshot: string;
};

export function createVoiceRecoveryBadcaseSignal(
  event: VoiceRecoveryEvent,
): VoiceRecoveryBadcaseSignal {
  return {
    kind: "voice_recovery",
    sessionId: event.sessionId,
    reason: event.reason,
    action: event.action,
    inputSnapshot: `voice recovery: ${event.reason}; health=${event.health}; action=${event.action}`,
  };
}
