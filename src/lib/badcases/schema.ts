import { z } from "zod";

export const badcaseKindSchema = z.enum([
  "wrong_correction",
  "low_quality_assessment",
  "bad_summary",
  "user_dismissed_correction",
  "user_regenerated",
  "provider_schema_failure",
]);

export const badcaseStatusSchema = z.enum([
  "candidate",
  "reviewed",
  "active",
  "ignored",
]);

export const badcaseSourceSchema = z.enum(["user", "system", "provider"]);

export const badcaseSignalSchema = z.object({
  id: z.string().min(1),
  kind: badcaseKindSchema,
  status: badcaseStatusSchema,
  source: badcaseSourceSchema,
  sessionId: z.string().min(1),
  scenarioId: z.string().min(1),
  scenarioVersion: z.string().min(1),
  skillId: z.string().min(1),
  createdAt: z.string().min(1),
  turnId: z.string().min(1).optional(),
  goalId: z.string().min(1).optional(),
  userFeedback: z.string().optional(),
  inputSnapshot: z.record(z.string(), z.unknown()),
}).strict();

export const badcaseHintSchema = z.object({
  kind: badcaseKindSchema,
  scenarioId: z.string().min(1),
  skillId: z.string().min(1),
  lesson: z.string().min(1),
  avoidPattern: z.string().min(1),
  suggestedBehavior: z.string().min(1),
  sourceSignalId: z.string().min(1),
}).strict();

export type BadcaseKind = z.infer<typeof badcaseKindSchema>;
export type BadcaseSignal = z.infer<typeof badcaseSignalSchema>;
export type BadcaseHint = z.infer<typeof badcaseHintSchema>;
