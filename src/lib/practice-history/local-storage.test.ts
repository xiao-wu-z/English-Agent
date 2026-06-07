import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LocalPracticeSessionRepository,
  PRACTICE_HISTORY_STORAGE_KEY,
} from "./index.ts";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

function session(id: string, status = "completed") {
  return {
    id,
    scenarioId: "daily-small-talk",
    scenarioVersion: "1.0.0",
    status,
    createdAt: `2026-06-07T00:00:${id.padStart(2, "0")}.000Z`,
    startedAt: "2026-06-07T00:00:00.000Z",
    endedAt: "2026-06-07T00:01:00.000Z",
    updatedAt: `2026-06-07T00:00:${id.padStart(2, "0")}.000Z`,
    turns: [],
    finalSummary: {
      sessionId: id,
      overallScore: 80,
      dimensionScores: {
        fluency: 80,
        pronunciationClarity: 80,
        grammar: 80,
        vocabulary: 80,
        expression: 80,
        coherence: 80,
      },
      strengths: ["Clear greeting."],
      priorityIssues: ["Ask more follow-up questions."],
      correctedSentences: [],
      recommendedExpressions: ["Nice to meet you."],
      nextPracticeSuggestions: ["Practice one more small talk exchange."],
      disclaimer: "Scores are internal learning feedback and are not official exam results.",
    },
  };
}

describe("local practice history", () => {
  it("saves, gets, lists, updates, and deletes sessions", () => {
    const storage = new MemoryStorage();
    const repository = new LocalPracticeSessionRepository(storage);
    repository.saveSession(session("1"));
    assert.equal(storage.getItem(PRACTICE_HISTORY_STORAGE_KEY)?.includes('"version":1'), true);
    assert.equal(repository.getSession("1")?.id, "1");
    assert.equal(repository.listSessions()[0].turnCount, 0);
    repository.updateSession({ ...session("1"), scenarioId: "job-interview" });
    assert.equal(repository.getSession("1")?.scenarioId, "job-interview");
    repository.deleteSession("1");
    assert.equal(repository.getSession("1"), undefined);
    repository.deleteSession("missing");
  });

  it("prunes total sessions, limits failed sessions, and rejects forbidden data", () => {
    const repository = new LocalPracticeSessionRepository(new MemoryStorage());
    for (let index = 0; index < 60; index += 1) {
      const status = index < 12 ? "failed" : "completed";
      repository.saveSession(
        status === "failed"
          ? { ...session(String(index), "failed"), finalSummary: undefined, failureReason: "provider failed" }
          : session(String(index), "completed"),
      );
    }
    const all = repository.getAllSessionsForTest();
    assert.equal(all.length, 50);
    assert.equal(all.filter((item) => item.status === "failed").length, 10);
    assert.throws(
      () =>
        repository.saveSession({
          ...session("secret"),
          apiKey: "should-not-save",
        } as never),
      /schema_validation_failed/,
    );
  });
});
