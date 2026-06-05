import { z } from "zod";

export const confidenceLabelSchema = z.enum(["high", "medium", "low"]);
export const riskLevelSchema = z.enum(["low", "medium", "high"]);
export const scoreSchema = z.number().min(0).max(100);

export const recommendedActionSchema = z.enum([
  "none",
  "suppress_correction",
  "clarify_next_turn",
  "flag_for_summary",
  "regenerate_private_suggestion",
]);

export const correctionTypeSchema = z.enum([
  "grammar",
  "vocabulary",
  "pronunciation_clarity",
  "expression",
  "coherence",
]);

export const severitySchema = z.enum(["minor", "medium", "major"]);
export const displayTimingSchema = z.enum(["after_turn", "summary"]);
export const correctionActionSchema = z.enum([
  "show",
  "suppress",
  "flag_for_summary",
]);

export const candidateIssueSchema = z.object({
  type: correctionTypeSchema,
  original: z.string().min(1),
  note: z.string().min(1),
  confidenceLabel: confidenceLabelSchema,
}).strict();

export const practiceTurnGuidanceSchema = z.object({
  nextAiMove: z.enum(["ask", "follow_up", "encourage", "clarify", "wrap_up"]),
  targetGoalId: z.string().min(1).optional(),
  shouldContinue: z.boolean(),
  spokenReplyGuidance: z.string().min(1),
  candidateIssues: z.array(candidateIssueSchema),
}).strict();

export const assessmentScoresSchema = z.object({
  fluency: scoreSchema,
  pronunciationClarity: scoreSchema,
  grammar: scoreSchema,
  vocabulary: scoreSchema,
  coherence: scoreSchema,
  scenarioRelevance: scoreSchema,
  roleAlignment: scoreSchema,
}).strict();

export const assessmentResultSchema = z.object({
  scope: z.enum(["turn", "session"]),
  scores: assessmentScoresSchema,
  confidenceLabel: confidenceLabelSchema,
  riskLevel: riskLevelSchema,
  evidence: z.array(z.string().min(1)).min(1),
  recommendedAction: recommendedActionSchema,
}).strict();

export const qualityAssessmentSchema = z.object({
  roleAlignment: scoreSchema,
  scenarioRelevance: scoreSchema,
  pedagogicalValue: scoreSchema,
  correctionAccuracy: scoreSchema.optional(),
  hallucinationRisk: riskLevelSchema,
  userLevelFit: scoreSchema.optional(),
  confidenceLabel: confidenceLabelSchema,
  reasons: z.array(z.string().min(1)).min(1),
  recommendedAction: recommendedActionSchema,
}).strict();

export const correctionItemSchema = z.object({
  id: z.string().min(1),
  turnId: z.string().min(1),
  type: correctionTypeSchema,
  original: z.string().min(1),
  corrected: z.string().min(1),
  explanation: z.string().min(1),
  severity: severitySchema,
  displayTiming: displayTimingSchema,
  confidenceLabel: confidenceLabelSchema,
  action: correctionActionSchema,
}).strict();

export const summaryScoresSchema = z.object({
  fluency: scoreSchema,
  pronunciationClarity: scoreSchema,
  grammar: scoreSchema,
  vocabulary: scoreSchema,
  expression: scoreSchema,
  coherence: scoreSchema,
}).strict();

export const practiceSummarySchema = z.object({
  sessionId: z.string().min(1),
  overallScore: scoreSchema,
  dimensionScores: summaryScoresSchema,
  strengths: z.array(z.string().min(1)),
  priorityIssues: z.array(z.string().min(1)),
  correctedSentences: z.array(correctionItemSchema),
  recommendedExpressions: z.array(z.string().min(1)),
  nextPracticeSuggestions: z.array(z.string().min(1)),
  disclaimer: z.string().min(1),
}).strict();

export type ConfidenceLabel = z.infer<typeof confidenceLabelSchema>;
export type RiskLevel = z.infer<typeof riskLevelSchema>;
export type RecommendedAction = z.infer<typeof recommendedActionSchema>;
export type CorrectionType = z.infer<typeof correctionTypeSchema>;
export type CorrectionSeverity = z.infer<typeof severitySchema>;
export type CorrectionDisplayTiming = z.infer<typeof displayTimingSchema>;
export type CorrectionAction = z.infer<typeof correctionActionSchema>;
export type CandidateIssue = z.infer<typeof candidateIssueSchema>;
export type PracticeTurnGuidance = z.infer<
  typeof practiceTurnGuidanceSchema
>;
export type AssessmentScores = z.infer<typeof assessmentScoresSchema>;
export type AssessmentResult = z.infer<typeof assessmentResultSchema>;
export type QualityAssessment = z.infer<typeof qualityAssessmentSchema>;
export type CorrectionItem = z.infer<typeof correctionItemSchema>;
export type SummaryScores = z.infer<typeof summaryScoresSchema>;
export type PracticeSummary = z.infer<typeof practiceSummarySchema>;
