import { randomUUID } from "node:crypto";
import {
  type RealtimeModelProvider,
  type RealtimeProviderEvent,
  type RealtimeSession,
} from "../model-providers/realtime-types.ts";
import { resolveRealtimeProvider } from "../model-providers/server/realtime-index.ts";
import type { ProviderEnv } from "../model-providers/server/registry.ts";
import { assertScenarioById } from "../scenarios/index.ts";
import type { Scenario } from "../scenarios/schema.ts";
import {
  decideAudioForwarding,
  type AudioChunkMetadata,
} from "../voice-audio-format/index.ts";
import {
  createVoiceSkillSession,
  endVoiceSkillSession,
  handleVoiceTranscript,
} from "../voice-skill-flow/orchestrator.server.ts";
import type { RealtimeApplicationEvent } from "./application-events.ts";

export type RealtimePracticeEvent =
  | RealtimeProviderEvent
  | RealtimeApplicationEvent;

type VoiceSkillCompletion = Awaited<ReturnType<typeof endVoiceSkillSession>>;

export type RealtimePracticeSession = {
  id: string;
  scenarioId: string;
  scenario: Scenario;
  provider: RealtimeModelProvider;
  providerSession: RealtimeSession;
  skillSessionId: string;
  events: RealtimePracticeEvent[];
  subscribers: Set<(event: RealtimePracticeEvent) => void>;
  processedFinalEventIds: Set<string>;
  transcriptProcessing: Promise<void>;
  providerClosed: boolean;
  endProcessing?: Promise<VoiceSkillCompletion>;
};

const sessions = new Map<string, RealtimePracticeSession>();

const DEFAULT_ACCEPTED_AUDIO_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
] as const;

const QWEN_ACCEPTED_AUDIO_MIME_TYPES = [
  "audio/pcm",
  "audio/pcm;rate=16000",
  "pcm",
] as const;

function getRealtimeProviderEnv(): ProviderEnv {
  return {
    MODEL_PROVIDER: process.env.MODEL_PROVIDER,
    DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY,
    QWEN_API_KEY: process.env.QWEN_API_KEY,
    QWEN_REALTIME_MODEL: process.env.QWEN_REALTIME_MODEL,
    QWEN_REALTIME_URL: process.env.QWEN_REALTIME_URL,
  };
}

function acceptedAudioMimeTypes(providerName: string): readonly string[] {
  return providerName === "qwen"
    ? QWEN_ACCEPTED_AUDIO_MIME_TYPES
    : DEFAULT_ACCEPTED_AUDIO_MIME_TYPES;
}

export async function createRealtimePracticeSession(input: {
  scenarioId: string;
  provider?: RealtimeModelProvider;
}): Promise<RealtimePracticeSession> {
  const scenario = assertScenarioById(input.scenarioId);
  const provider = input.provider ?? resolveRealtimeProvider(getRealtimeProviderEnv());
  const sessionId = `voice-session-${randomUUID()}`;
  const skillSession = await createVoiceSkillSession({ scenarioId: scenario.id });
  const events: RealtimePracticeEvent[] = [];
  const subscribers = new Set<(event: RealtimePracticeEvent) => void>();
  const providerSession = await provider.createSession({
    scenarioId: scenario.id,
    sessionId,
    instructions: buildRealtimeScenarioInstructions(scenario),
  });
  const session: RealtimePracticeSession = {
    id: sessionId,
    scenarioId: scenario.id,
    scenario,
    provider,
    providerSession,
    skillSessionId: skillSession.session.id,
    events,
    subscribers,
    processedFinalEventIds: new Set(),
    transcriptProcessing: Promise.resolve(),
    providerClosed: false,
  };
  provider.onEvent(providerSession.id, (event) => {
    appendRealtimePracticeEvent(session, event);
    if (
      event.type === "transcript.user.final" &&
      event.text?.trim() &&
      !session.processedFinalEventIds.has(event.id)
    ) {
      session.processedFinalEventIds.add(event.id);
      session.transcriptProcessing = session.transcriptProcessing
        .then(async () => {
          const result = await handleVoiceTranscript({
            sessionId: session.skillSessionId,
            transcript: event.text ?? "",
            final: true,
          });
          if (result.persisted && result.realtimeCorrection) {
            appendRealtimePracticeEvent(session, {
              id: `voice-app-event-${randomUUID()}`,
              sessionId: session.id,
              createdAt: new Date().toISOString(),
              type: "correction.ready",
              correction: result.realtimeCorrection,
            });
          }
        })
        .catch(() => {
          appendRealtimePracticeEvent(session, {
            id: `voice-app-event-${randomUUID()}`,
            sessionId: session.id,
            createdAt: new Date().toISOString(),
            type: "workflow.error",
            error: {
              code: "correction_failed",
              message: "本轮轻纠错暂时不可用，语音练习可以继续。",
            },
          });
        });
    }
  });
  sessions.set(sessionId, session);
  return session;
}

export async function sendRealtimePracticeText(input: {
  sessionId: string;
  text: string;
}): Promise<RealtimePracticeEvent[]> {
  const session = assertRealtimePracticeSession(input.sessionId);
  await session.provider.sendText(session.providerSession.id, input.text);
  return session.events;
}

export async function sendRealtimePracticeAudio(input: {
  sessionId: string;
  chunk: Uint8Array;
  metadata: AudioChunkMetadata;
}): Promise<{ accepted: true }> {
  const forwarding = decideAudioForwarding(
    {
      ...input.metadata,
      byteLength: input.chunk.byteLength,
    },
    acceptedAudioMimeTypes(sessionProviderName(input.sessionId)),
  );
  if (forwarding.action === "reject") {
    throw new Error(forwarding.error.message);
  }
  const session = assertRealtimePracticeSession(input.sessionId);
  if (session.provider.name !== "mock") {
    await session.provider.sendAudioChunk(session.providerSession.id, input.chunk);
    return { accepted: true };
  }
  appendRealtimePracticeEvent(session, {
    id: `voice-event-${randomUUID()}`,
    sessionId: session.id,
    type: "transcript.user.final",
    providerName: session.providerSession.providerName,
    modelName: session.providerSession.modelName,
    createdAt: new Date().toISOString(),
    text: "Mock voice transcript.",
  });
  appendRealtimePracticeEvent(session, {
    id: `voice-event-${randomUUID()}`,
    sessionId: session.id,
    type: "transcript.assistant.final",
    providerName: session.providerSession.providerName,
    modelName: session.providerSession.modelName,
    createdAt: new Date().toISOString(),
    text: "Thanks. Please continue with one more sentence.",
  });
  return { accepted: true };
}

export function getRealtimePracticeEvents(sessionId: string): RealtimePracticeEvent[] {
  return assertRealtimePracticeSession(sessionId).events;
}

export async function endRealtimePracticeSession(sessionId: string) {
  const session = assertRealtimePracticeSession(sessionId);
  if (!session.endProcessing) {
    session.endProcessing = (async () => {
      await session.transcriptProcessing;
      if (!session.providerClosed) {
        await session.provider.endSession(session.providerSession.id);
        session.providerClosed = true;
      }
      return endVoiceSkillSession({
        sessionId: session.skillSessionId,
      });
    })().catch((error) => {
      session.endProcessing = undefined;
      throw error;
    });
  }
  const result = await session.endProcessing;
  return {
    ...result,
    scenario: session.scenario,
  };
}

export function subscribeRealtimePracticeEvents(
  sessionId: string,
  handler: (event: RealtimePracticeEvent) => void,
): () => void {
  const session = assertRealtimePracticeSession(sessionId);
  session.subscribers.add(handler);
  return () => {
    session.subscribers.delete(handler);
  };
}

function assertRealtimePracticeSession(sessionId: string): RealtimePracticeSession {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error("realtime_session_not_found");
  }
  return session;
}

function sessionProviderName(sessionId: string): string {
  return assertRealtimePracticeSession(sessionId).provider.name;
}

function appendRealtimePracticeEvent(
  session: RealtimePracticeSession,
  event: RealtimePracticeEvent,
): void {
  session.events.push(event);
  for (const subscriber of session.subscribers) {
    subscriber(event);
  }
}

function buildRealtimeScenarioInstructions(scenario: Scenario): string {
  const goals = scenario.goals.map((goal) => goal.label).join("; ");
  const constraints = scenario.constraints.join(" ");
  return [
    `You are the ${scenario.context.aiRole}.`,
    `Setting: ${scenario.context.setting}`,
    `The learner is the ${scenario.context.userRole}.`,
    `Purpose: ${scenario.context.learnerPurpose}`,
    `Practice goals: ${goals}.`,
    constraints,
    "Keep replies concise, natural, and in role. Ask one question at a time.",
  ].join(" ");
}
