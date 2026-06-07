import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createRealtimePracticeSession,
  getRealtimePracticeEvents,
  sendRealtimePracticeAudio,
  sendRealtimePracticeText,
} from "./orchestrator.server.ts";

describe("realtime voice practice flow", () => {
  it("creates a mock realtime session and exposes normalized events", async () => {
    const session = await createRealtimePracticeSession({
      scenarioId: "daily-small-talk",
    });
    assert.equal(session.providerSession.providerName, "mock");

    await sendRealtimePracticeText({
      sessionId: session.id,
      text: "Hello voice practice.",
    });

    const eventTypes = getRealtimePracticeEvents(session.id).map((event) => event.type);
    assert.ok(eventTypes.includes("transcript.user.final"));
    assert.ok(eventTypes.includes("transcript.assistant.final"));
    assert.ok(eventTypes.includes("audio.delta"));
  });

  it("rejects empty audio chunks", async () => {
    const session = await createRealtimePracticeSession({
      scenarioId: "daily-small-talk",
    });
    await assert.rejects(
      () => sendRealtimePracticeAudio({
        sessionId: session.id,
        chunk: new Uint8Array(),
      }),
      /audio_chunk_invalid/,
    );
  });
});
