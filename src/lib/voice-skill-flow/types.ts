import { z } from "zod";

export const createVoiceSkillSessionRequestSchema = z.object({
  scenarioId: z.string().min(1),
}).strict();

export const voiceTranscriptInputSchema = z.object({
  sessionId: z.string().min(1),
  transcript: z.string(),
  final: z.boolean(),
}).strict();

export const endVoiceSkillSessionRequestSchema = z.object({
  sessionId: z.string().min(1),
}).strict();

export type CreateVoiceSkillSessionRequest = z.infer<
  typeof createVoiceSkillSessionRequestSchema
>;
export type VoiceTranscriptInput = z.infer<typeof voiceTranscriptInputSchema>;
export type EndVoiceSkillSessionRequest = z.infer<
  typeof endVoiceSkillSessionRequestSchema
>;
