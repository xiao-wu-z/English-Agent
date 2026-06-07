import WebSocket from "ws";
import {
  RealtimeProviderError,
  type RealtimeModelProvider,
  type RealtimeProviderEvent,
  type RealtimeSession,
  type RealtimeSessionInput,
} from "../realtime-types.ts";
import type { ProviderEnv } from "./registry.ts";

export const DEFAULT_QWEN_REALTIME_MODEL = "qwen3.5-omni-plus-realtime";
export const DEFAULT_QWEN_REALTIME_URL =
  "wss://dashscope.aliyuncs.com/api-ws/v1/realtime";

type QwenSocket = {
  readyState: number;
  on(eventName: string, listener: (value?: unknown) => void): QwenSocket;
  send(payload: string): void;
  close(): void;
};

type QwenSocketFactory = (
  url: string,
  options: { headers: Record<string, string> },
) => QwenSocket;

type QwenRealtimeConfig = {
  apiKey: string;
  providerName: "qwen";
  modelName: string;
  url: string;
  publicConfig: {
    providerName: "qwen";
    modelName: string;
    url: string;
    inputAudioFormat: "pcm";
    inputSampleRate: 16000;
    outputAudioFormat: "pcm";
    outputSampleRate: 24000;
  };
};

type QwenSessionState = {
  session: RealtimeSession;
  socket: QwenSocket;
  handlers: Set<(event: RealtimeProviderEvent) => void>;
};

function nowIso(): string {
  return new Date().toISOString();
}

function eventId(raw: Record<string, unknown>): string {
  return typeof raw.event_id === "string" && raw.event_id.length > 0
    ? raw.event_id
    : `qwen-event-${crypto.randomUUID()}`;
}

function safeText(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function resolveQwenRealtimeConfig(
  env: ProviderEnv = {},
): QwenRealtimeConfig {
  const apiKey = env.DASHSCOPE_API_KEY ?? env.QWEN_API_KEY;
  if (!apiKey) {
    throw new RealtimeProviderError({
      code: "missing_api_key",
      providerName: "qwen",
      message: "Qwen realtime provider requires DASHSCOPE_API_KEY or QWEN_API_KEY",
    });
  }
  const modelName = env.QWEN_REALTIME_MODEL ?? DEFAULT_QWEN_REALTIME_MODEL;
  const baseUrl = env.QWEN_REALTIME_URL ?? DEFAULT_QWEN_REALTIME_URL;
  const url = `${baseUrl}?model=${encodeURIComponent(modelName)}`;
  return {
    apiKey,
    providerName: "qwen",
    modelName,
    url,
    publicConfig: {
      providerName: "qwen",
      modelName,
      url,
      inputAudioFormat: "pcm",
      inputSampleRate: 16000,
      outputAudioFormat: "pcm",
      outputSampleRate: 24000,
    },
  };
}

export function normalizeQwenRealtimeEvent(
  rawEvent: unknown,
  context: {
    sessionId: string;
    providerName: string;
    modelName: string;
  },
): RealtimeProviderEvent | null {
  if (!rawEvent || typeof rawEvent !== "object") {
    return null;
  }
  const raw = rawEvent as Record<string, unknown>;
  const type = safeText(raw.type);
  const base = {
    id: eventId(raw),
    sessionId: context.sessionId,
    providerName: context.providerName,
    modelName: context.modelName,
    createdAt: nowIso(),
  };

  if (type === "session.created") {
    return { ...base, type: "session.created" };
  }
  if (type === "conversation.item.input_audio_transcription.delta") {
    return {
      ...base,
      type: "transcript.user.partial",
      text: `${safeText(raw.text) ?? ""}${safeText(raw.stash) ?? ""}`,
    };
  }
  if (type === "conversation.item.input_audio_transcription.completed") {
    return {
      ...base,
      type: "transcript.user.final",
      text: safeText(raw.transcript),
    };
  }
  if (type === "response.audio_transcript.delta") {
    return {
      ...base,
      type: "transcript.assistant.partial",
      text: safeText(raw.delta),
    };
  }
  if (type === "response.audio_transcript.done") {
    return {
      ...base,
      type: "transcript.assistant.final",
      text: safeText(raw.transcript),
    };
  }
  if (type === "response.text.done") {
    return {
      ...base,
      type: "transcript.assistant.final",
      text: safeText(raw.text),
    };
  }
  if (type === "response.audio.delta") {
    return {
      ...base,
      type: "audio.delta",
      audio: {
        encoding: "pcm/base64",
        data: safeText(raw.delta) ?? "",
      },
    };
  }
  if (type === "error") {
    const error =
      raw.error && typeof raw.error === "object"
        ? raw.error as Record<string, unknown>
        : {};
    return {
      ...base,
      type: "error",
      error: {
        code: safeText(error.code) ?? "qwen_error",
        message: safeText(error.message) ?? "Qwen realtime error",
      },
    };
  }
  return null;
}

function defaultSocketFactory(
  url: string,
  options: { headers: Record<string, string> },
): QwenSocket {
  return new WebSocket(url, options) as QwenSocket;
}

export class QwenRealtimeWebSocketProvider implements RealtimeModelProvider {
  readonly name = "qwen";
  readonly modelName: string;
  private readonly config: QwenRealtimeConfig;
  private readonly socketFactory: QwenSocketFactory;
  private readonly sessions = new Map<string, QwenSessionState>();

  constructor(options: {
    env?: ProviderEnv;
    socketFactory?: QwenSocketFactory;
  } = {}) {
    this.config = resolveQwenRealtimeConfig(options.env);
    this.modelName = this.config.modelName;
    this.socketFactory = options.socketFactory ?? defaultSocketFactory;
  }

  toJSON(): QwenRealtimeConfig["publicConfig"] {
    return this.config.publicConfig;
  }

  async createSession(input: RealtimeSessionInput): Promise<RealtimeSession> {
    const session: RealtimeSession = {
      id: input.sessionId ?? `qwen-session-${crypto.randomUUID()}`,
      providerName: this.name,
      modelName: this.modelName,
      status: "active",
      createdAt: nowIso(),
    };
    const socket = this.socketFactory(this.config.url, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
    });
    const state: QwenSessionState = {
      session,
      socket,
      handlers: new Set(),
    };
    this.sessions.set(session.id, state);

    await new Promise<void>((resolve, reject) => {
      socket.on("open", () => {
        socket.send(JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            voice: "Tina",
            input_audio_format: "pcm",
            output_audio_format: "pcm",
            instructions: "You are an English speaking practice coach. Keep replies concise and natural.",
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              silence_duration_ms: 800,
            },
          },
        }));
        resolve();
      });
      socket.on("error", () => {
        reject(new RealtimeProviderError({
          code: "session_create_failed",
          providerName: this.name,
          sessionId: session.id,
          message: "Qwen realtime websocket connection failed",
        }));
      });
    });

    socket.on("message", (message) => this.handleMessage(session.id, message));
    socket.on("close", () => {
      const current = this.sessions.get(session.id);
      if (!current) {
        return;
      }
      current.session = {
        ...current.session,
        status: "closed",
        closedAt: nowIso(),
      };
      this.emit(current, {
        id: `qwen-event-${crypto.randomUUID()}`,
        sessionId: session.id,
        type: "session.closed",
        providerName: this.name,
        modelName: this.modelName,
        createdAt: nowIso(),
      });
    });
    return session;
  }

  async sendText(): Promise<void> {
    throw new RealtimeProviderError({
      code: "unsupported_provider",
      providerName: this.name,
      message: "Qwen realtime websocket text input is not enabled in this MVP",
    });
  }

  async sendAudioChunk(sessionId: string, chunk: Uint8Array): Promise<void> {
    const state = this.assertSession(sessionId);
    if (chunk.byteLength === 0) {
      throw new RealtimeProviderError({
        code: "audio_chunk_invalid",
        providerName: this.name,
        sessionId,
        message: "Audio chunk is empty",
      });
    }
    state.socket.send(JSON.stringify({
      type: "input_audio_buffer.append",
      audio: Buffer.from(chunk).toString("base64"),
    }));
  }

  async endSession(sessionId: string): Promise<void> {
    const state = this.assertSession(sessionId);
    state.socket.close();
  }

  onEvent(
    sessionId: string,
    handler: (event: RealtimeProviderEvent) => void,
  ): () => void {
    const state = this.assertSession(sessionId);
    state.handlers.add(handler);
    return () => {
      state.handlers.delete(handler);
    };
  }

  private handleMessage(sessionId: string, message: unknown): void {
    const state = this.sessions.get(sessionId);
    if (!state) {
      return;
    }
    try {
      const parsed = JSON.parse(String(message));
      const normalized = normalizeQwenRealtimeEvent(parsed, {
        sessionId,
        providerName: this.name,
        modelName: this.modelName,
      });
      if (normalized) {
        this.emit(state, normalized);
      }
    } catch {
      this.emit(state, {
        id: `qwen-event-${crypto.randomUUID()}`,
        sessionId,
        type: "error",
        providerName: this.name,
        modelName: this.modelName,
        createdAt: nowIso(),
        error: {
          code: "event_parse_failed",
          message: "Failed to parse Qwen realtime event",
        },
      });
    }
  }

  private assertSession(sessionId: string): QwenSessionState {
    const state = this.sessions.get(sessionId);
    if (!state || state.session.status !== "active") {
      throw new RealtimeProviderError({
        code: "connection_closed",
        providerName: this.name,
        sessionId,
        message: "Realtime session is not active",
      });
    }
    return state;
  }

  private emit(state: QwenSessionState, event: RealtimeProviderEvent): void {
    for (const handler of state.handlers) {
      handler(event);
    }
  }
}

export function createQwenRealtimeWebSocketProvider(
  env: ProviderEnv = {},
): QwenRealtimeWebSocketProvider {
  return new QwenRealtimeWebSocketProvider({ env });
}
