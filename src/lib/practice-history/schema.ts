import { z } from "zod";
import { practiceSessionSchema } from "../practice-session/schema.ts";

export const PRACTICE_HISTORY_STORAGE_KEY = "english-agent.practice-sessions.v1";
export const PRACTICE_HISTORY_STORAGE_VERSION = 1;

export const practiceSessionListItemSchema = z.object({
  id: z.string().min(1),
  scenarioId: z.string().min(1),
  scenarioVersion: z.string().min(1),
  scenarioTitleZh: z.string().optional(),
  status: z.string().min(1),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  turnCount: z.number().int().min(0),
  overallScore: z.number().min(0).max(100).optional(),
  summaryPreview: z.string().optional(),
  updatedAt: z.string().min(1),
}).strict();

export const practiceHistoryPayloadSchema = z.object({
  version: z.literal(PRACTICE_HISTORY_STORAGE_VERSION),
  sessions: z.array(practiceSessionSchema),
  updatedAt: z.string().min(1),
}).strict();

export const practiceHistoryErrorCodeSchema = z.enum([
  "parse_failed",
  "schema_validation_failed",
  "quota_exceeded",
  "storage_unavailable",
]);

export type PracticeSessionListItem = z.infer<typeof practiceSessionListItemSchema>;
export type PracticeHistoryPayload = z.infer<typeof practiceHistoryPayloadSchema>;
export type PracticeHistoryErrorCode = z.infer<typeof practiceHistoryErrorCodeSchema>;

export class PracticeHistoryStorageError extends Error {
  public readonly code: PracticeHistoryErrorCode;

  constructor(
    code: PracticeHistoryErrorCode,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.code = code;
    this.name = "PracticeHistoryStorageError";
  }
}
