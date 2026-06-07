import { randomUUID } from "node:crypto";
import {
  type RealtimeProviderEvent,
  type RealtimeSession,
} from "../model-providers/realtime-types.ts";
import { resolveRealtimeProvider } from "../model-providers/server/realtime-index.ts";
import { assertScenarioById } from "../scenarios/index.ts";

type RealtimePracticeSession = {
  id: string;
  scenarioId: string;
  providerSession: RealtimeSession;
  events: RealtimeProviderEvent[];
};

const sessions = new Map<string, RealtimePracticeSession>();

export async function createRealtimePracticeSession(input: {
  scenarioId: string;
}): Promise<RealtimePracticeSession> {
  const scenario = assertScenarioById(input.scenarioId);
  const provider = resolveRealtimeProvider({});
  const sessionId = `voice-session-${randomUUID()}`;
  const events: RealtimeProviderEvent[] = [];
  const providerSession = await provider.createSession({
    scenarioId: scenario.id,
    sessionId,
  });
  provider.onEvent(providerSession.id, (event) => events.push(event));
  const session = {
    id: sessionId,
    scenarioId: scenario.id,
    providerSession,
    events,
  };
  sessions.set(sessionId, session);
  return session;
}

export async function sendRealtimePracticeText(input: {
  sessionId: string;
  text: string;
}): Promise<RealtimeProviderEvent[]> {
  const session = assertRealtimePracticeSession(input.sessionId);
  const provider = resolveRealtimeProvider({});
  provider.onEvent(session.providerSession.id, (event) => session.events.push(event));
  await provider.createSession({
    scenarioId: session.scenarioId,
    sessionId: session.providerSession.id,
  });
  await provider.sendText(session.providerSession.id, input.text);
  return session.events;
}

export async function sendRealtimePracticeAudio(input: {
  sessionId: string;
  chunk: Uint8Array;
}): Promise<{ accepted: true }> {
  if (input.chunk.byteLength === 0) {
    throw new Error("audio_chunk_invalid");
  }
  const session = assertRealtimePracticeSession(input.sessionId);
  session.events.push({
    id: `voice-event-${randomUUID()}`,
    sessionId: session.id,
    type: "transcript.user.final",
    providerName: session.providerSession.providerName,
    modelName: session.providerSession.modelName,
    createdAt: new Date().toISOString(),
    text: "Mock voice transcript.",
  });
  session.events.push({
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

function assertRealtimePracticeSession(sessionId: string): RealtimePracticeSession {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error("realtime_session_not_found");
  }
  return session;
}
