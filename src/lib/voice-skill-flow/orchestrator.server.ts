import {
  createTextPracticeSession,
  endTextPracticeSession,
  submitTextPracticeTurn,
} from "../text-practice-flow/orchestrator.server.ts";
import {
  createVoiceSkillSessionRequestSchema,
  endVoiceSkillSessionRequestSchema,
  voiceTranscriptInputSchema,
  type CreateVoiceSkillSessionRequest,
  type EndVoiceSkillSessionRequest,
  type VoiceTranscriptInput,
} from "./types.ts";

export async function createVoiceSkillSession(
  request: CreateVoiceSkillSessionRequest,
) {
  const parsed = createVoiceSkillSessionRequestSchema.parse(request);
  return createTextPracticeSession(parsed);
}

export async function handleVoiceTranscript(input: VoiceTranscriptInput) {
  const parsed = voiceTranscriptInputSchema.parse(input);
  if (!parsed.final) {
    return {
      persisted: false as const,
      previewText: parsed.transcript,
    };
  }
  const result = await submitTextPracticeTurn({
    sessionId: parsed.sessionId,
    userText: parsed.transcript,
  });
  return {
    persisted: true as const,
    turn: result.turn,
    aiReply: result.aiReply,
    realtimeCorrection: result.realtimeCorrection,
  };
}

export async function endVoiceSkillSession(
  request: EndVoiceSkillSessionRequest,
) {
  const parsed = endVoiceSkillSessionRequestSchema.parse(request);
  return endTextPracticeSession(parsed);
}
