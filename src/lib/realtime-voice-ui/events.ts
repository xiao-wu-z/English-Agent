import type { RealtimeProviderEvent } from "../model-providers/realtime-types.ts";
import type { VoicePracticeUiState } from "./state.ts";

export function applyRealtimeEventToVoiceState(
  state: VoicePracticeUiState,
  event: RealtimeProviderEvent,
): VoicePracticeUiState {
  switch (event.type) {
    case "session.created":
      return { ...state, status: "listening", errorMessage: undefined };
    case "transcript.user.partial":
      return { ...state, userPartialTranscript: event.text ?? "" };
    case "transcript.user.final":
      return {
        ...state,
        status: "thinking",
        userPartialTranscript: undefined,
        messages: [
          ...state.messages,
          { role: "user", content: event.text ?? "" },
        ],
      };
    case "transcript.assistant.partial":
      return {
        ...state,
        status: "speaking",
        assistantPartialTranscript: event.text ?? "",
      };
    case "transcript.assistant.final":
      return {
        ...state,
        status: "speaking",
        assistantPartialTranscript: undefined,
        messages: [
          ...state.messages,
          { role: "assistant", content: event.text ?? "" },
        ],
      };
    case "audio.delta":
      return {
        ...state,
        status: "speaking",
        playbackQueue: event.audio
          ? [...state.playbackQueue, event.audio]
          : state.playbackQueue,
      };
    case "interruption":
      return { ...state, status: "listening", playbackQueue: [] };
    case "error":
      return {
        ...state,
        status: "failed",
        errorMessage: event.error?.message ?? "语音练习发生错误",
      };
    case "session.closed":
      return { ...state, status: "completed" };
  }
}
