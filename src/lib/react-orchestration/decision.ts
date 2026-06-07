import type {
  ReActDecision,
  ReActLoopPolicy,
} from "./schema.ts";
import { defaultReactLoopPolicy, isSessionInactive } from "./policy.ts";

export function decideFromQualityGate(input: {
  schemaValid: boolean;
  confidenceLabel: "high" | "medium" | "low";
  riskLevel: "low" | "medium" | "high";
  hallucinationRisk: "low" | "medium" | "high";
  retryCount: number;
  providerFailureCount: number;
  policy?: ReActLoopPolicy;
  maxStepsReached: boolean;
  sessionStatus: string;
}): ReActDecision {
  const policy = input.policy ?? defaultReactLoopPolicy;
  if (isSessionInactive(input.sessionStatus)) {
    return {
      action: "final",
      reasonCode: input.sessionStatus === "abandoned" ? "user_abandoned" : "session_not_active",
      shouldStop: true,
      shouldLogBadcase: false,
    };
  }
  if (input.maxStepsReached) {
    return {
      action: "defer_to_summary",
      reasonCode: "max_steps_reached",
      shouldStop: true,
      shouldLogBadcase: true,
    };
  }
  if (input.providerFailureCount >= policy.maxProviderFailures) {
    return {
      action: "suppress",
      reasonCode: "provider_failed",
      shouldStop: true,
      shouldLogBadcase: true,
    };
  }
  if (!input.schemaValid) {
    if (input.retryCount < policy.maxRetriesPerStep) {
      return {
        action: "retry",
        reasonCode: "schema_validation_failed",
        shouldStop: false,
        shouldLogBadcase: false,
      };
    }
    return {
      action: "suppress",
      reasonCode: "schema_validation_failed",
      shouldStop: policy.stopOnSchemaValidationFailureAfterRetry,
      shouldLogBadcase: true,
    };
  }
  if (
    input.hallucinationRisk === "high" ||
    (policy.stopOnHighRisk && input.riskLevel === "high")
  ) {
    return {
      action: "suppress",
      reasonCode: "high_hallucination_risk",
      shouldStop: true,
      shouldLogBadcase: true,
    };
  }
  if (input.confidenceLabel === "low") {
    return {
      action: "defer_to_summary",
      reasonCode: "low_confidence",
      shouldStop: false,
      shouldLogBadcase: false,
    };
  }
  return {
    action: "show",
    reasonCode: "high_confidence",
    shouldStop: false,
    shouldLogBadcase: false,
  };
}
