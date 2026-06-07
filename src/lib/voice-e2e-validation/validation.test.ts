import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildVoiceE2EChecklist,
  voiceDiagnosticsSchema,
} from "./index.ts";

describe("voice end-to-end validation", () => {
  it("defines a full voice MVP checklist", () => {
    const checklist = buildVoiceE2EChecklist();
    const ids = checklist.map((item) => item.id);

    assert.deepEqual(ids, [
      "start-session",
      "pcm-capture",
      "audio-send",
      "qwen-transcript",
      "sse-ui-update",
      "end-session",
    ]);
  });

  it("validates safe diagnostics without secrets or raw audio", () => {
    const diagnostics = voiceDiagnosticsSchema.parse({
      sessionId: "voice-session-1",
      providerName: "qwen",
      modelName: "qwen3.5-omni-plus-realtime",
      audioFormat: "audio/pcm;rate=16000",
      sseStatus: "connected",
      lastEventType: "transcript.user.final",
      fallbackReason: "none",
    });

    assert.equal(diagnostics.sseStatus, "connected");
    assert.doesNotMatch(JSON.stringify(diagnostics), /sk-|Authorization|rawAudio|base64/i);
  });
});
