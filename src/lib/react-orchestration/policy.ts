import type { ReActLoopPolicy, ReActRun } from "./schema.ts";

export const defaultReactLoopPolicy: ReActLoopPolicy = {
  maxSteps: 5,
  maxRetriesPerStep: 1,
  maxProviderFailures: 2,
  stopOnHighRisk: true,
  stopOnSchemaValidationFailureAfterRetry: true,
};

export function canContinueReactRun(run: ReActRun): boolean {
  return run.status === "running" && run.steps.length < run.policy.maxSteps;
}

export function isSessionInactive(status: string): boolean {
  return status === "abandoned" || status === "failed";
}
