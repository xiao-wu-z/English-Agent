import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createVoicePracticeResponseSchema,
  voicePracticeEventSchema,
  voicePracticeReportResponseSchema,
} from "./types.ts";

const scenario = {
  id: "daily-small-talk",
  titleZh: "日常闲聊",
  descriptionZh: "练习简单日常对话和自然追问。",
  difficulty: "beginner",
  maxSessionMinutes: 8,
  aiRole: "New acquaintance",
  userRole: "Participant",
  goals: ["Start a friendly conversation", "Ask a follow-up question"],
};

describe("voice practice client contracts", () => {
  it("validates create responses with public scenario metadata", () => {
    const parsed = createVoicePracticeResponseSchema.parse({
      session: {
        id: "voice-session-1",
        scenario,
        providerName: "qwen",
        modelName: "qwen3.5-omni-plus-realtime",
      },
    });

    assert.equal(parsed.session.scenario.titleZh, "日常闲聊");
  });

  it("validates provider and correction events in one browser union", () => {
    assert.equal(
      voicePracticeEventSchema.parse({
        id: "provider-event-1",
        sessionId: "voice-session-1",
        type: "transcript.user.final",
        providerName: "qwen",
        modelName: "qwen3.5-omni-plus-realtime",
        createdAt: "2026-06-07T00:00:00.000Z",
        text: "I want talk about weekend.",
      }).type,
      "transcript.user.final",
    );
    assert.equal(
      voicePracticeEventSchema.parse({
        id: "app-event-1",
        sessionId: "voice-session-1",
        createdAt: "2026-06-07T00:00:01.000Z",
        type: "correction.ready",
        correction: {
          id: "correction-1",
          turnId: "turn-1",
          type: "expression",
          original: "I want talk about weekend.",
          corrected: "I'd like talk about weekend.",
          explanation: "这里用 I'd like 会更自然。",
          severity: "medium",
          displayTiming: "after_turn",
          confidenceLabel: "high",
          action: "show",
        },
      }).type,
      "correction.ready",
    );
  });

  it("validates completed report responses", () => {
    const parsed = voicePracticeReportResponseSchema.parse({
      session: { id: "skill-session-1", status: "completed" },
      scenario,
      savedToHistory: true,
      summary: {
        sessionId: "skill-session-1",
        overallScore: 82,
        dimensionScores: {
          fluency: 80,
          pronunciationClarity: 78,
          grammar: 82,
          vocabulary: 84,
          expression: 83,
          coherence: 85,
        },
        strengths: ["You stayed in the scenario."],
        priorityIssues: ["Use more natural request phrases."],
        correctedSentences: [],
        recommendedExpressions: ["I'd like to..."],
        nextPracticeSuggestions: ["Practice one more small-talk session."],
        disclaimer: "This feedback is for practice only.",
      },
    });

    assert.equal(parsed.summary.dimensionScores.expression, 83);
  });
});
