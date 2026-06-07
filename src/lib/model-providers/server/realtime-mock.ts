import { randomUUID } from "node:crypto";
import {
  RealtimeProviderError,
  type RealtimeModelProvider,
  type RealtimeProviderEvent,
  type RealtimeSession,
  type RealtimeSessionInput,
} from "../realtime-types.ts";

type EventHandler = (event: RealtimeProviderEvent) => void;

function nowIso(): string {
  return new Date().toISOString();
}

function event(
  session: RealtimeSession,
  type: RealtimeProviderEvent["type"],
  payload: Partial<RealtimeProviderEvent> = {},
): RealtimeProviderEvent {
  return {
    id: `rt-event-${randomUUID()}`,
    sessionId: session.id,
    type,
    providerName: session.providerName,
    modelName: session.modelName,
    createdAt: nowIso(),
    ...payload,
  };
}

export class MockRealtimeProvider implements RealtimeModelProvider {
  name = "mock";
  modelName = "mock-realtime";
  private sessions = new Map<string, RealtimeSession>();
  private handlers = new Map<string, Set<EventHandler>>();

  async createSession(input: RealtimeSessionInput): Promise<RealtimeSession> {
    const session: RealtimeSession = {
      id: input.sessionId ?? `rt-session-${randomUUID()}`,
      providerName: this.name,
      modelName: this.modelName,
      status: "active",
      createdAt: nowIso(),
    };
    this.sessions.set(session.id, session);
    this.emit(session, event(session, "session.created"));
    return session;
  }

  async sendText(sessionId: string, text: string): Promise<void> {
    const session = this.assertSession(sessionId);
    this.emit(session, event(session, "transcript.user.final", { text }));
    this.emit(
      session,
      event(session, "transcript.assistant.final", {
        text: "Thanks. Could you answer one more question in English?",
      }),
    );
    this.emit(
      session,
      event(session, "audio.delta", {
        audio: {
          encoding: "mock/base64",
          data: "bW9jay1hdWRpbw==",
        },
      }),
    );
  }

  async sendAudioChunk(sessionId: string, chunk: Uint8Array): Promise<void> {
    this.assertSession(sessionId);
    if (chunk.byteLength === 0) {
      throw new RealtimeProviderError({
        code: "audio_chunk_invalid",
        providerName: this.name,
        sessionId,
        message: "Audio chunk is empty",
      });
    }
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.assertSession(sessionId);
    const closed: RealtimeSession = {
      ...session,
      status: "closed",
      closedAt: nowIso(),
    };
    this.sessions.set(sessionId, closed);
    this.emit(closed, event(closed, "session.closed"));
  }

  onEvent(sessionId: string, handler: EventHandler): () => void {
    const handlers = this.handlers.get(sessionId) ?? new Set<EventHandler>();
    handlers.add(handler);
    this.handlers.set(sessionId, handlers);
    return () => {
      handlers.delete(handler);
    };
  }

  private assertSession(sessionId: string): RealtimeSession {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "active") {
      throw new RealtimeProviderError({
        code: "connection_closed",
        providerName: this.name,
        sessionId,
        message: "Realtime session is not active",
      });
    }
    return session;
  }

  private emit(session: RealtimeSession, realtimeEvent: RealtimeProviderEvent): void {
    const handlers = this.handlers.get(session.id);
    if (!handlers) {
      return;
    }
    for (const handler of handlers) {
      handler(realtimeEvent);
    }
  }
}
