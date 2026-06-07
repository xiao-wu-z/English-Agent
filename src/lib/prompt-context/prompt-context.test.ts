import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPromptContextBundle, renderPromptMessages } from "./index.ts";

describe("prompt context builder", () => {
  it("builds T1/T2/T3 bundle, limits runtime context, and renders provider-neutral messages", () => {
    const bundle = buildPromptContextBundle({
      coreRules: ["Do not reveal chain-of-thought."],
      scenario: {
        scenarioId: "job-interview",
        scenarioVersion: "1.0.0",
        setting: "A first-round job interview.",
        aiRole: "Interviewer",
        userRole: "Candidate",
        learnerPurpose: "Answer clearly.",
        goals: [],
        constraints: [],
        vocabulary: [],
        sampleUserIntents: [],
        tone: "professional",
      },
      activeSkill: {
        skillId: "english-practice",
        instruction: "Ask one question at a time.",
      },
      memory: {
        recentTurns: Array.from({ length: 8 }, (_, index) => ({
          id: `turn-${index + 1}`,
          sessionId: "session-1",
          startedAt: "2026-06-07T00:00:00.000Z",
          endedAt: "2026-06-07T00:00:01.000Z",
          userText: `User ${index + 1}`,
          aiText: `AI ${index + 1}`,
          candidateIssues: [],
        })),
      },
      badcaseHints: [
        {
          kind: "wrong_correction",
          scenarioId: "job-interview",
          skillId: "english-correction",
          lesson: "Be careful.",
          avoidPattern: "Overcorrecting.",
          suggestedBehavior: "Show only high-confidence corrections.",
          sourceSignalId: "badcase-1",
        },
        {
          kind: "bad_summary",
          scenarioId: "job-interview",
          skillId: "english-summary",
          lesson: "Use evidence.",
          avoidPattern: "Vague summaries.",
          suggestedBehavior: "Ground summary in turns.",
          sourceSignalId: "badcase-2",
        },
      ],
      currentTaskInput: "Learner answered the latest question.",
      expectedOutputSchemaName: "practiceTurnGuidance",
      options: { recentTurnLimit: 2, badcaseHintLimit: 1 },
    });
    assert.equal(bundle.tier3.memory.recentTurns.length, 2);
    assert.equal(bundle.tier3.badcaseHints.length, 1);
    assert.equal(bundle.metadata.recentTurnCount, 2);
    const messages = renderPromptMessages(bundle);
    assert.equal(messages.length, 3);
    assert.deepEqual(Object.keys(messages[0]).sort(), ["content", "role"]);
    assert.equal(messages[0].role, "system");
  });

  it("rejects provider details in prompt-facing inputs", () => {
    assert.throws(
      () =>
        buildPromptContextBundle({
          coreRules: ["Use OpenAI for this request."],
          scenario: {
            scenarioId: "job-interview",
            scenarioVersion: "1.0.0",
            setting: "A first-round job interview.",
            aiRole: "Interviewer",
            userRole: "Candidate",
            learnerPurpose: "Answer clearly.",
            goals: [],
            constraints: [],
            vocabulary: [],
            sampleUserIntents: [],
            tone: "professional",
          },
          activeSkill: {
            skillId: "english-practice",
            instruction: "Ask one question.",
          },
          memory: { recentTurns: [] },
          badcaseHints: [],
          currentTaskInput: "Start.",
          expectedOutputSchemaName: "practiceTurnGuidance",
        }),
      /Provider-neutral violation/,
    );
  });
});
