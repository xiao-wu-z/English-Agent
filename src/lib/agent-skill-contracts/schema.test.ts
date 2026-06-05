import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessmentResultSchema,
  correctionItemSchema,
  practiceSummarySchema,
  practiceTurnGuidanceSchema,
  qualityAssessmentSchema,
} from "./schema.ts";

describe("agent skill contract schemas", () => {
  it("validates practice turn guidance", () => {
    const guidance = practiceTurnGuidanceSchema.parse({
      nextAiMove: "follow_up",
      targetGoalId: "order-main-dish",
      shouldContinue: true,
      spokenReplyGuidance: "Ask one short follow-up question.",
      candidateIssues: [
        {
          type: "expression",
          original: "I want chicken.",
          note: "Could be more polite in a restaurant context.",
          confidenceLabel: "high",
        },
      ],
    });

    assert.equal(guidance.nextAiMove, "follow_up");
    assert.equal(guidance.candidateIssues[0].confidenceLabel, "high");
  });

  it("rejects assessment scores outside the 0 to 100 range", () => {
    assert.throws(() =>
      assessmentResultSchema.parse({
        scope: "turn",
        scores: {
          fluency: 101,
          pronunciationClarity: 80,
          grammar: 75,
          vocabulary: 72,
          coherence: 70,
          scenarioRelevance: 90,
          roleAlignment: 95,
        },
        confidenceLabel: "medium",
        riskLevel: "low",
        evidence: ["The response stayed on topic."],
        recommendedAction: "none",
      }),
    );
  });

  it("validates quality assessment without chain-of-thought", () => {
    const quality = qualityAssessmentSchema.parse({
      roleAlignment: 92,
      scenarioRelevance: 88,
      pedagogicalValue: 80,
      correctionAccuracy: 85,
      hallucinationRisk: "low",
      userLevelFit: 78,
      confidenceLabel: "high",
      reasons: ["The reply matched the waiter role."],
      recommendedAction: "none",
    });

    assert.equal(quality.hallucinationRisk, "low");
    assert.equal(quality.recommendedAction, "none");
    assert.equal("thought" in quality, false);
  });

  it("rejects hidden reasoning fields", () => {
    assert.throws(() =>
      qualityAssessmentSchema.parse({
        roleAlignment: 92,
        scenarioRelevance: 88,
        pedagogicalValue: 80,
        hallucinationRisk: "low",
        confidenceLabel: "high",
        reasons: ["The reply matched the waiter role."],
        recommendedAction: "none",
        thought: "Hidden reasoning must not be accepted.",
      }),
    );
  });

  it("validates correction display timing and confidence", () => {
    const correction = correctionItemSchema.parse({
      id: "correction-1",
      turnId: "turn-1",
      type: "grammar",
      original: "I want order chicken.",
      corrected: "I'd like to order the chicken.",
      explanation: "Use 'would like to' for polite ordering.",
      severity: "medium",
      displayTiming: "after_turn",
      confidenceLabel: "high",
      action: "show",
    });

    assert.equal(correction.displayTiming, "after_turn");
    assert.equal(correction.action, "show");
  });

  it("validates a structured practice summary", () => {
    const summary = practiceSummarySchema.parse({
      sessionId: "session-1",
      overallScore: 82,
      dimensionScores: {
        fluency: 80,
        pronunciationClarity: 76,
        grammar: 84,
        vocabulary: 78,
        expression: 82,
        coherence: 85,
      },
      strengths: ["You answered quickly and stayed in the restaurant scenario."],
      priorityIssues: ["Use more polite ordering phrases."],
      correctedSentences: [
        {
          id: "correction-1",
          turnId: "turn-1",
          type: "expression",
          original: "I want chicken.",
          corrected: "I'd like the chicken, please.",
          explanation: "This sounds more natural and polite.",
          severity: "medium",
          displayTiming: "summary",
          confidenceLabel: "high",
          action: "show",
        },
      ],
      recommendedExpressions: ["I'd like to order...", "Could I have...?"],
      nextPracticeSuggestions: ["Practice ordering and asking about ingredients."],
      disclaimer:
        "Scores are internal learning feedback and are not official exam results.",
    });

    assert.equal(summary.correctedSentences[0].displayTiming, "summary");
  });
});
