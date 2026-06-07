import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertSessionTransition,
  buildConversationMemorySnapshot,
  canTransitionSession,
  practiceSessionSchema,
  shouldCompressConversation,
} from "./index.ts";

const baseSession = {
  id: "session-1",
  scenarioId: "job-interview",
  scenarioVersion: "1.0.0",
  status: "active",
  createdAt: "2026-06-07T00:00:00.000Z",
  startedAt: "2026-06-07T00:00:00.000Z",
  updatedAt: "2026-06-07T00:00:00.000Z",
  turns: [],
};

describe("practice session flow", () => {
  it("validates lifecycle terminal requirements and transitions", () => {
    assert.equal(canTransitionSession("created", "active"), true);
    assert.equal(canTransitionSession("active", "completed"), false);
    assert.throws(
      () => assertSessionTransition("active", "completed"),
      /Invalid session transition: active -> completed/,
    );
    assert.throws(
      () => practiceSessionSchema.parse({ ...baseSession, status: "failed" }),
      /failureReason/,
    );
    assert.throws(
      () => practiceSessionSchema.parse({ ...baseSession, status: "completed" }),
      /finalSummary/,
    );
    assert.equal(
      practiceSessionSchema.parse({ ...baseSession, status: "abandoned" }).status,
      "abandoned",
    );
  });

  it("builds memory snapshot from rolling summary plus recent turns without mutation", () => {
    const turns = Array.from({ length: 9 }, (_, index) => ({
      id: `turn-${index + 1}`,
      sessionId: "session-1",
      startedAt: "2026-06-07T00:00:00.000Z",
      endedAt: "2026-06-07T00:00:01.000Z",
      userText: `User ${index + 1}`,
      aiText: `AI ${index + 1}`,
      candidateIssues: [],
    }));
    const session = {
      ...baseSession,
      turns,
      rollingSummary: {
        coveredGoals: ["intro"],
        unresolvedIssues: ["past tense"],
        learnerPatterns: ["short answers"],
        conversationFacts: ["candidate is a frontend developer"],
        correctionFocus: ["use examples"],
        lastUpdatedTurnId: "turn-6",
        updatedAt: "2026-06-07T00:00:00.000Z",
      },
    };
    const snapshot = buildConversationMemorySnapshot(session, {
      recentTurnLimit: 3,
      currentUserInput: "One more answer",
    });
    assert.equal(snapshot.recentTurns.length, 3);
    assert.equal(snapshot.recentTurns[0].id, "turn-7");
    assert.equal(snapshot.rollingSummary?.coveredGoals[0], "intro");
    assert.equal(snapshot.currentUserInput, "One more answer");
    assert.equal(session.turns.length, 9);
    assert.equal(shouldCompressConversation(session), true);
  });
});
