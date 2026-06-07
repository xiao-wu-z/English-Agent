import { z } from "zod";

export const createTextPracticeSessionRequestSchema = z.object({
  scenarioId: z.string().min(1),
}).strict();

export const submitTextPracticeTurnRequestSchema = z.object({
  sessionId: z.string().min(1),
  userText: z.string(),
}).strict();

export const endTextPracticeSessionRequestSchema = z.object({
  sessionId: z.string().min(1),
}).strict();

export type CreateTextPracticeSessionRequest = z.infer<
  typeof createTextPracticeSessionRequestSchema
>;
export type SubmitTextPracticeTurnRequest = z.infer<
  typeof submitTextPracticeTurnRequestSchema
>;
export type EndTextPracticeSessionRequest = z.infer<
  typeof endTextPracticeSessionRequestSchema
>;

export class TextPracticeFlowError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, status: number, message: string) {
    super(`${code}: ${message}`);
    this.name = "TextPracticeFlowError";
    this.code = code;
    this.status = status;
  }
}
