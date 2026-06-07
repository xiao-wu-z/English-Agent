import { z } from "zod";
import {
  assessmentResultSchema,
  candidateIssueSchema,
  correctionItemSchema,
  practiceSummarySchema,
} from "../agent-skill-contracts/schema.ts";

export const practiceSessionStatusSchema = z.enum([
  "created",
  "active",
  "ending",
  "completed",
  "abandoned",
  "failed",
]);

export const practiceTurnSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  startedAt: z.string().min(1),
  endedAt: z.string().min(1),
  userText: z.string(),
  aiText: z.string(),
  targetGoalId: z.string().min(1).optional(),
  candidateIssues: z.array(candidateIssueSchema).default([]),
  turnAssessment: assessmentResultSchema.optional(),
  realtimeCorrection: correctionItemSchema.optional(),
}).strict();

export const rollingSummarySchema = z.object({
  coveredGoals: z.array(z.string()),
  unresolvedIssues: z.array(z.string()),
  learnerPatterns: z.array(z.string()),
  conversationFacts: z.array(z.string()),
  correctionFocus: z.array(z.string()),
  lastUpdatedTurnId: z.string().min(1),
  updatedAt: z.string().min(1),
}).strict();

export const conversationMemorySnapshotSchema = z.object({
  rollingSummary: rollingSummarySchema.optional(),
  recentTurns: z.array(practiceTurnSchema),
  currentUserInput: z.string().optional(),
}).strict();

const baseSessionSchema = z.object({
  id: z.string().min(1),
  scenarioId: z.string().min(1),
  scenarioVersion: z.string().min(1),
  status: practiceSessionStatusSchema,
  createdAt: z.string().min(1),
  startedAt: z.string().min(1).optional(),
  endedAt: z.string().min(1).optional(),
  updatedAt: z.string().min(1),
  turns: z.array(practiceTurnSchema),
  rollingSummary: rollingSummarySchema.optional(),
  finalSummary: practiceSummarySchema.optional(),
  failureReason: z.string().min(1).optional(),
}).strict();

export const practiceSessionSchema = baseSessionSchema.superRefine((session, ctx) => {
  if (session.status === "completed" && !session.finalSummary) {
    ctx.addIssue({
      code: "custom",
      path: ["finalSummary"],
      message: "completed session requires finalSummary",
    });
  }
  if (session.status === "failed" && !session.failureReason) {
    ctx.addIssue({
      code: "custom",
      path: ["failureReason"],
      message: "failed session requires failureReason",
    });
  }
});

export const practiceSessionEventTypeSchema = z.enum([
  "session.started",
  "turn.completed",
  "correction.dismissed",
  "session.ending",
  "summary.completed",
  "session.abandoned",
  "session.failed",
  "provider.schema_failed",
]);

export const practiceSessionEventSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  scenarioId: z.string().min(1),
  scenarioVersion: z.string().min(1),
  type: practiceSessionEventTypeSchema,
  createdAt: z.string().min(1),
  turnId: z.string().min(1).optional(),
}).strict();

export type PracticeSessionStatus = z.infer<typeof practiceSessionStatusSchema>;
export type PracticeTurn = z.infer<typeof practiceTurnSchema>;
export type RollingSummary = z.infer<typeof rollingSummarySchema>;
export type ConversationMemorySnapshot = z.infer<
  typeof conversationMemorySnapshotSchema
>;
export type PracticeSession = z.infer<typeof practiceSessionSchema>;
export type PracticeSessionEvent = z.infer<typeof practiceSessionEventSchema>;
