import {
  type TextGenerationRequest,
  type TextGenerationResult,
  type TextModelProvider,
} from "../types.ts";
import { parseAndValidateProviderOutput } from "../json.ts";

function fixtureFor(name: TextGenerationRequest["expectedOutputSchemaName"]): unknown {
  switch (name) {
    case "practiceTurnGuidance":
      return {
        nextAiMove: "follow_up",
        shouldContinue: true,
        spokenReplyGuidance: "Ask one short follow-up question in the scenario.",
        candidateIssues: [],
      };
    case "assessmentResult":
      return {
        scope: "turn",
        scores: {
          fluency: 80,
          pronunciationClarity: 78,
          grammar: 82,
          vocabulary: 80,
          coherence: 84,
          scenarioRelevance: 90,
          roleAlignment: 90,
        },
        confidenceLabel: "high",
        riskLevel: "low",
        evidence: ["The reply stayed relevant to the scenario."],
        recommendedAction: "none",
      };
    case "qualityAssessment":
      return {
        roleAlignment: 90,
        scenarioRelevance: 90,
        pedagogicalValue: 85,
        hallucinationRisk: "low",
        confidenceLabel: "high",
        reasons: ["The output is concise and grounded."],
        recommendedAction: "none",
      };
    case "correctionItem":
      return {
        id: "correction-1",
        turnId: "turn-1",
        type: "expression",
        original: "I want chicken.",
        corrected: "I'd like the chicken, please.",
        explanation: "This sounds more polite and natural.",
        severity: "medium",
        displayTiming: "after_turn",
        confidenceLabel: "high",
        action: "show",
      };
    case "practiceSummary":
      return {
        sessionId: "session-1",
        overallScore: 82,
        dimensionScores: {
          fluency: 80,
          pronunciationClarity: 78,
          grammar: 82,
          vocabulary: 80,
          expression: 82,
          coherence: 84,
        },
        strengths: ["You stayed in the scenario and answered clearly."],
        priorityIssues: ["Ask more follow-up questions."],
        correctedSentences: [],
        recommendedExpressions: ["Could you tell me more about...?"],
        nextPracticeSuggestions: ["Practice one more short exchange."],
        disclaimer: "Scores are internal learning feedback and are not official exam results.",
      };
  }
}

export class MockTextProvider implements TextModelProvider {
  name = "mock";
  modelName = "mock-text";

  async generateJson<T = unknown>(
    request: TextGenerationRequest,
  ): Promise<TextGenerationResult<T>> {
    const rawText = JSON.stringify(fixtureFor(request.expectedOutputSchemaName));
    return {
      rawText,
      parsed: parseAndValidateProviderOutput(
        rawText,
        request.expectedOutputSchemaName,
      ) as T,
      providerName: this.name,
      modelName: this.modelName,
    };
  }
}
