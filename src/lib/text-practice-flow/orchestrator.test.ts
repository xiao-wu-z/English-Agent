import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createTextPracticeSession,
  endTextPracticeSession,
  getTextPracticeSession,
  submitTextPracticeTurn,
} from "./orchestrator.server.ts";

describe("text practice demo flow", () => {
  it("creates a session, submits a text turn, ends with summary, and stores history", async () => {
    const created = await createTextPracticeSession({ scenarioId: "daily-small-talk" });
    assert.equal(created.session.status, "active");
    const turnResult = await submitTextPracticeTurn({
      sessionId: created.session.id,
      userText: "I want talk about weekend.",
    });
    assert.equal(turnResult.turn.userText, "I want talk about weekend.");
    assert.ok(turnResult.aiReply.length > 0);
    assert.match(turnResult.realtimeCorrection?.explanation ?? "", /更自然/);
    assert.equal(turnResult.session.turns.length, 1);
    const ended = await endTextPracticeSession({ sessionId: created.session.id });
    assert.equal(ended.session.status, "completed");
    assert.equal(ended.savedToHistory, true);
    assert.equal(getTextPracticeSession(created.session.id)?.status, "completed");
  });

  it("rejects empty turns and missing sessions", async () => {
    const created = await createTextPracticeSession({ scenarioId: "daily-small-talk" });
    await assert.rejects(
      () => submitTextPracticeTurn({ sessionId: created.session.id, userText: " " }),
      /empty_user_text/,
    );
    await assert.rejects(
      () => submitTextPracticeTurn({ sessionId: "missing", userText: "Hello" }),
      /session_not_found/,
    );
  });
});
