import { z } from "zod";
import {
  confidenceLabelSchema,
  riskLevelSchema,
} from "../agent-skill-contracts/schema.ts";

export const reactStepTypeSchema = z.enum([
  "observe",
  "act",
  "assess",
  "decide",
  "final",
]);

export const reactStepStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
]);

export const reactRunStatusSchema = z.enum([
  "running",
  "completed",
  "stopped",
  "failed",
]);

export const reactDecisionActionSchema = z.enum([
  "show",
  "suppress",
  "retry",
  "defer_to_summary",
  "ask_clarifying_question",
  "log_badcase",
  "final",
]);

export const reactDecisionReasonCodeSchema = z.enum([
  "high_confidence",
  "low_confidence",
  "schema_validation_failed",
  "high_hallucination_risk",
  "provider_failed",
  "max_steps_reached",
  "session_not_active",
  "user_abandoned",
  "policy_stop",
]);

export const reactLoopPolicySchema = z.object({
  maxSteps: z.number().int().positive(),
  maxRetriesPerStep: z.number().int().min(0),
  maxProviderFailures: z.number().int().min(0),
  stopOnHighRisk: z.boolean(),
  stopOnSchemaValidationFailureAfterRetry: z.boolean(),
}).strict();

export const reactStepSchema = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  index: z.number().int().positive(),
  type: reactStepTypeSchema,
  status: reactStepStatusSchema,
  skillId: z.string().min(1),
  inputSummary: z.string(),
  outputSummary: z.string(),
  confidenceLabel: confidenceLabelSchema.optional(),
  riskLevel: riskLevelSchema.optional(),
  startedAt: z.string().min(1),
  endedAt: z.string().min(1).optional(),
}).strict();

export const reactRunSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  scenarioId: z.string().min(1),
  scenarioVersion: z.string().min(1),
  skillId: z.string().min(1),
  task: z.string().min(1),
  status: reactRunStatusSchema,
  policy: reactLoopPolicySchema,
  providerFailureCount: z.number().int().min(0),
  steps: z.array(reactStepSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
}).strict();

export const reactDecisionSchema = z.object({
  action: reactDecisionActionSchema,
  reasonCode: reactDecisionReasonCodeSchema,
  shouldStop: z.boolean(),
  shouldLogBadcase: z.boolean().default(false),
}).strict();

export type ReActLoopPolicy = z.infer<typeof reactLoopPolicySchema>;
export type ReActRun = z.infer<typeof reactRunSchema>;
export type ReActDecision = z.infer<typeof reactDecisionSchema>;
