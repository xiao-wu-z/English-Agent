import type { VoiceE2EChecklistItem } from "./schema.ts";

export function buildVoiceE2EChecklist(): VoiceE2EChecklistItem[] {
  return [
    {
      id: "start-session",
      label: "Start realtime voice session",
      expected: "Qwen or mock realtime session is active.",
    },
    {
      id: "pcm-capture",
      label: "Capture PCM16 audio",
      expected: "Browser sends audio/pcm;rate=16000 chunks.",
    },
    {
      id: "audio-send",
      label: "Send audio chunk",
      expected: "Audio route accepts non-empty PCM chunks.",
    },
    {
      id: "qwen-transcript",
      label: "Receive user transcript",
      expected: "SSE receives transcript.user.final or safe fallback.",
    },
    {
      id: "sse-ui-update",
      label: "Render assistant transcript",
      expected: "UI shows normalized realtime provider events.",
    },
    {
      id: "end-session",
      label: "End session",
      expected: "Provider session closes without leaking secrets.",
    },
  ];
}
