import { z } from "zod";

export const realtimeSessionStatusSchema = z.enum([
  "active",
  "closed",
  "failed",
]);

export const realtimeSessionSchema = z.object({
  id: z.string().min(1),
  providerName: z.string().min(1),
  modelName: z.string().min(1),
  status: realtimeSessionStatusSchema,
  createdAt: z.string().min(1),
  closedAt: z.string().min(1).optional(),
}).strict();

export const realtimeProviderEventTypeSchema = z.enum([
  "session.created",
  "transcript.user.partial",
  "transcript.user.final",
  "transcript.assistant.partial",
  "transcript.assistant.final",
  "audio.delta",
  "interruption",
  "error",
  "session.closed",
]);

export const realtimeProviderEventSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  type: realtimeProviderEventTypeSchema,
  providerName: z.string().min(1),
  modelName: z.string().min(1),
  createdAt: z.string().min(1),
  text: z.string().optional(),
  audio: z.object({
    encoding: z.string().min(1),
    data: z.string().min(1),
  }).strict().optional(),
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
  }).strict().optional(),
}).strict();

export const realtimeProviderErrorCodeSchema = z.enum([
  "missing_api_key",
  "session_create_failed",
  "event_parse_failed",
  "audio_chunk_invalid",
  "connection_closed",
  "timeout",
  "unsupported_provider",
]);

export type RealtimeSession = z.infer<typeof realtimeSessionSchema>;
export type RealtimeProviderEvent = z.infer<typeof realtimeProviderEventSchema>;
export type RealtimeProviderErrorCode = z.infer<
  typeof realtimeProviderErrorCodeSchema
>;

export type RealtimeSessionInput = {
  scenarioId: string;
  sessionId?: string;
  instructions?: string;
};

export type RealtimeModelProvider = {
  name: string;
  modelName: string;
  createSession(input: RealtimeSessionInput): Promise<RealtimeSession>;
  sendText(sessionId: string, text: string): Promise<void>;
  sendAudioChunk(sessionId: string, chunk: Uint8Array): Promise<void>;
  endSession(sessionId: string): Promise<void>;
  onEvent(
    sessionId: string,
    handler: (event: RealtimeProviderEvent) => void,
  ): () => void;
};

export class RealtimeProviderError extends Error {
  public readonly code: RealtimeProviderErrorCode;
  public readonly providerName: string;
  public readonly sessionId?: string;

  constructor(options: {
    code: RealtimeProviderErrorCode;
    providerName: string;
    message: string;
    sessionId?: string;
  }) {
    super(`${options.code}: ${options.message}`);
    this.name = "RealtimeProviderError";
    this.code = options.code;
    this.providerName = options.providerName;
    this.sessionId = options.sessionId;
  }
}
