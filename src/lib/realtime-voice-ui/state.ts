import { z } from "zod";

export const voicePracticeUiStatusSchema = z.enum([
  "idle",
  "requesting_microphone",
  "ready",
  "connecting",
  "listening",
  "thinking",
  "speaking",
  "ending",
  "completed",
  "failed",
  "abandoned",
]);

export type VoicePracticeUiStatus = z.infer<typeof voicePracticeUiStatusSchema>;

export type VoiceUiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type VoicePracticeUiState = {
  status: VoicePracticeUiStatus;
  userPartialTranscript?: string;
  assistantPartialTranscript?: string;
  messages: VoiceUiMessage[];
  playbackQueue: Array<{ encoding: string; data: string }>;
  errorMessage?: string;
};

const transitions: Record<VoicePracticeUiStatus, VoicePracticeUiStatus[]> = {
  idle: ["requesting_microphone", "failed"],
  requesting_microphone: ["ready", "failed", "abandoned"],
  ready: ["connecting", "abandoned", "failed"],
  connecting: ["listening", "failed", "abandoned"],
  listening: ["thinking", "speaking", "ending", "failed", "abandoned"],
  thinking: ["listening", "speaking", "ending", "failed", "abandoned"],
  speaking: ["listening", "ending", "failed", "abandoned"],
  ending: ["completed", "failed"],
  completed: [],
  failed: [],
  abandoned: [],
};

export function canTransitionVoiceState(
  from: VoicePracticeUiStatus,
  to: VoicePracticeUiStatus,
): boolean {
  return transitions[from].includes(to);
}
