import { z } from "zod";
import { practiceSummarySchema } from "../agent-skill-contracts/schema.ts";
import { realtimeProviderEventSchema } from "../model-providers/realtime-types.ts";
import { realtimeApplicationEventSchema } from "../realtime-voice-flow/application-events.ts";
import type { Scenario } from "../scenarios/schema.ts";

export const voicePracticeScenarioSchema = z.object({
  id: z.string().min(1),
  titleZh: z.string().min(1),
  descriptionZh: z.string().min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  maxSessionMinutes: z.number().int().positive(),
  aiRole: z.string().min(1),
  userRole: z.string().min(1),
  goals: z.array(z.string().min(1)).min(1),
}).strict();

export const createVoicePracticeResponseSchema = z.object({
  session: z.object({
    id: z.string().min(1),
    scenario: voicePracticeScenarioSchema,
    providerName: z.string().min(1),
    modelName: z.string().min(1),
  }).strict(),
}).strict();

export const voicePracticeEventSchema = z.union([
  realtimeProviderEventSchema,
  realtimeApplicationEventSchema,
]);

export const voicePracticeReportResponseSchema = z.object({
  session: z.object({
    id: z.string().min(1),
    status: z.literal("completed"),
  }).passthrough(),
  scenario: voicePracticeScenarioSchema,
  summary: practiceSummarySchema,
  savedToHistory: z.boolean(),
}).strict();

export type VoicePracticeScenario = z.infer<
  typeof voicePracticeScenarioSchema
>;
export type CreateVoicePracticeResponse = z.infer<
  typeof createVoicePracticeResponseSchema
>;
export type VoicePracticeEvent = z.infer<typeof voicePracticeEventSchema>;
export type VoicePracticeReportResponse = z.infer<
  typeof voicePracticeReportResponseSchema
>;

export function toVoicePracticeScenario(
  scenario: Scenario,
): VoicePracticeScenario {
  return voicePracticeScenarioSchema.parse({
    id: scenario.id,
    titleZh: scenario.titleZh,
    descriptionZh: scenario.descriptionZh,
    difficulty: scenario.difficulty,
    maxSessionMinutes: scenario.maxSessionMinutes,
    aiRole: scenario.context.aiRole,
    userRole: scenario.context.userRole,
    goals: scenario.goals.map((goal) => goal.label),
  });
}
