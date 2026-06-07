import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canContinueReactRun,
  decideFromQualityGate,
  defaultReactLoopPolicy,
  reactStepSchema,
} from "./index.ts";

describe("bounded react orchestration", () => {
  it("enforces max steps and rejects hidden reasoning", () => {
    const run = {
      id: "run-1",
      sessionId: "session-1",
      scenarioId: "job-interview",
      scenarioVersion: "1.0.0",
      skillId: "english-correction",
      task: "correction",
      status: "running",
      policy: defaultReactLoopPolicy,
      providerFailureCount: 0,
      steps: Array.from({ length: 5 }, (_, index) => ({
        id: `step-${index + 1}`,
        runId: "run-1",
        index: index + 1,
        type: "act",
        status: "completed",
        skillId: "english-correction",
        inputSummary: "input",
        outputSummary: "output",
        startedAt: "2026-06-07T00:00:00.000Z",
      })),
      createdAt: "2026-06-07T00:00:00.000Z",
      updatedAt: "2026-06-07T00:00:00.000Z",
    };
    assert.equal(canContinueReactRun(run), false);
    assert.throws(
      () =>
        reactStepSchema.parse({
          ...run.steps[0],
          thought: "hidden reasoning",
        }),
      /Unrecognized key/,
    );
  });

  it("decides show, suppress, or retry within policy", () => {
    assert.equal(
      decideFromQualityGate({
        schemaValid: true,
        confidenceLabel: "high",
        riskLevel: "low",
        hallucinationRisk: "low",
        retryCount: 0,
        providerFailureCount: 0,
        policy: defaultReactLoopPolicy,
        maxStepsReached: false,
        sessionStatus: "active",
      }).action,
      "show",
    );
    assert.equal(
      decideFromQualityGate({
        schemaValid: false,
        confidenceLabel: "medium",
        riskLevel: "medium",
        hallucinationRisk: "medium",
        retryCount: 0,
        providerFailureCount: 0,
        policy: defaultReactLoopPolicy,
        maxStepsReached: false,
        sessionStatus: "active",
      }).action,
      "retry",
    );
    assert.equal(
      decideFromQualityGate({
        schemaValid: true,
        confidenceLabel: "high",
        riskLevel: "high",
        hallucinationRisk: "high",
        retryCount: 0,
        providerFailureCount: 0,
        policy: defaultReactLoopPolicy,
        maxStepsReached: false,
        sessionStatus: "active",
      }).action,
      "suppress",
    );
  });
});
