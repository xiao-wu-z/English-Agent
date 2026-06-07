import { randomUUID } from "node:crypto";
import {
  type RealtimeModelProvider,
  type RealtimeProviderEvent,
  type RealtimeSession,
} from "../model-providers/realtime-types.ts";
import { resolveRealtimeProvider } from "../model-providers/server/realtime-index.ts";
import type { ProviderEnv } from "../model-providers/server/registry.ts";
import { assertScenarioById } from "../scenarios/index.ts";
import {
  decideAudioForwarding,
  type AudioChunkMetadata,
} from "../voice-audio-format/index.ts";

type RealtimePracticeSession = {
  id: string;
  scenarioId: string;
  provider: RealtimeModelProvider;
  providerSession: RealtimeSession;
  events: RealtimeProviderEvent[];
  subscribers: Set<(event: RealtimeProviderEvent) => void>;
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
  const events: RealtimeProviderEvent[] = [];
  const subscribers = new Set<(event: RealtimeProviderEvent) => void>();
  const providerSession = await provider.createSession({
    scenarioId: scenario.id,
    sessionId,
  });
  const session = {
    id: sessionId,
    scenarioId: scenario.id,
    provider,
    providerSession,
    events,
    subscribers,
  };
  provider.onEvent(providerSession.id, (event) => appendRealtimePracticeEvent(session, event));
  sessions.set(sessionId, session);
  return session;
}

export async function sendRealtimePracticeText(input: {
  sessionId: string;
  text: string;
}): Promise<RealtimeProviderEvent[]> {
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

export function getRealtimePracticeEvents(sessionId: string): RealtimeProviderEvent[] {
  return assertRealtimePracticeSession(sessionId).events;
}

export async function endRealtimePracticeSession(sessionId: string): Promise<{
  accepted: true;
}> {
  const session = assertRealtimePracticeSession(sessionId);
  await session.provider.endSession(session.providerSession.id);
  return { accepted: true };
}

export function subscribeRealtimePracticeEvents(
  sessionId: string,
  handler: (event: RealtimeProviderEvent) => void,
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
  event: RealtimeProviderEvent,
): void {
  session.events.push(event);
  for (const subscriber of session.subscribers) {
    subscriber(event);
  }
}
