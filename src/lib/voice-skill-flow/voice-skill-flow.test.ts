import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createVoiceSkillSession,
  endVoiceSkillSession,
  handleVoiceTranscript,
} from "./index.ts";

describe("voice skill runtime integration", () => {
  it("persists final transcript as a practice turn and can show Chinese correction", async () => {
    const session = await createVoiceSkillSession({ scenarioId: "daily-small-talk" });
    const result = await handleVoiceTranscript({
      sessionId: session.session.id,
      transcript: "I want talk about weekend.",
      final: true,
    });

    assert.equal(result.persisted, true);
    assert.equal(result.turn?.userText, "I want talk about weekend.");
    assert.match(result.realtimeCorrection?.explanation ?? "", /更自然/);
  });

  it("does not persist partial transcript", async () => {
    const session = await createVoiceSkillSession({ scenarioId: "daily-small-talk" });
    const result = await handleVoiceTranscript({
      sessionId: session.session.id,
      transcript: "I want",
      final: false,
    });

    assert.deepEqual(result, {
      persisted: false,
      previewText: "I want",
    });
  });

  it("creates summary and assessment-shaped result on end", async () => {
    const session = await createVoiceSkillSession({ scenarioId: "daily-small-talk" });
    await handleVoiceTranscript({
      sessionId: session.session.id,
      transcript: "Hello, nice to meet you.",
      final: true,
    });

    const ended = await endVoiceSkillSession({ sessionId: session.session.id });

    assert.equal(ended.session.status, "completed");
    assert.equal(typeof ended.summary.overallScore, "number");
    assert.doesNotMatch(JSON.stringify(ended), /rawAudio|base64|hiddenReasoning|sk-/i);
  });
});
