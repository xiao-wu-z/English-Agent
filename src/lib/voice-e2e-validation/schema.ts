import { z } from "zod";

export const voiceDiagnosticsSchema = z.object({
  sessionId: z.string().min(1),
  providerName: z.string().min(1),
  modelName: z.string().min(1),
  audioFormat: z.string().min(1),
  sseStatus: z.enum(["idle", "connecting", "connected", "disconnected", "failed"]),
  lastEventType: z.string().min(1),
  fallbackReason: z.string().min(1),
}).strict();

export const voiceE2EChecklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  expected: z.string().min(1),
}).strict();

export type VoiceDiagnostics = z.infer<typeof voiceDiagnosticsSchema>;
export type VoiceE2EChecklistItem = z.infer<typeof voiceE2EChecklistItemSchema>;
