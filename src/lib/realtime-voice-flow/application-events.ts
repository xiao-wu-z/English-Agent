import { z } from "zod";
import { correctionItemSchema } from "../agent-skill-contracts/schema.ts";

const applicationEventBaseSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  createdAt: z.string().min(1),
});

export const correctionReadyEventSchema = applicationEventBaseSchema.extend({
  type: z.literal("correction.ready"),
  correction: correctionItemSchema,
}).strict();

export const workflowErrorEventSchema = applicationEventBaseSchema.extend({
  type: z.literal("workflow.error"),
  error: z.object({
    code: z.enum(["correction_failed", "summary_failed"]),
    message: z.string().min(1),
  }).strict(),
}).strict();

export const realtimeApplicationEventSchema = z.discriminatedUnion("type", [
  correctionReadyEventSchema,
  workflowErrorEventSchema,
]);

export type RealtimeApplicationEvent = z.infer<
  typeof realtimeApplicationEventSchema
>;
