import {
  type PracticeSession,
  practiceSessionSchema,
} from "../practice-session/schema.ts";
import {
  PRACTICE_HISTORY_STORAGE_KEY,
  PRACTICE_HISTORY_STORAGE_VERSION,
  type PracticeHistoryPayload,
  PracticeHistoryStorageError,
  type PracticeSessionListItem,
  practiceHistoryPayloadSchema,
} from "./schema.ts";

const forbiddenKeys = [
  "apiKey",
  "providerSecret",
  "authorization",
  "Authorization",
  "rawSecretConfig",
  "secretEnvironment",
  "audioBlob",
  "audioBytes",
  "audioFile",
  "hiddenReasoning",
  "chainOfThought",
  "reasoningTrace",
  "thought",
];

function nowIso(): string {
  return new Date().toISOString();
}

function assertNoForbiddenData(value: unknown): void {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") {
      continue;
    }
    for (const [key, nested] of Object.entries(current)) {
      if (forbiddenKeys.includes(key)) {
        throw new PracticeHistoryStorageError(
          "schema_validation_failed",
          `Forbidden local history field: ${key}`,
        );
      }
      stack.push(nested);
    }
  }
}

function toListItem(session: PracticeSession): PracticeSessionListItem {
  return {
    id: session.id,
    scenarioId: session.scenarioId,
    scenarioVersion: session.scenarioVersion,
    status: session.status,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    turnCount: session.turns.length,
    overallScore: session.finalSummary?.overallScore,
    summaryPreview: session.finalSummary?.strengths[0],
    updatedAt: session.updatedAt,
  };
}

export class LocalPracticeSessionRepository {
  private readonly storage: Storage | undefined;

  constructor(storage: Storage | undefined = globalThis.localStorage) {
    this.storage = storage;
  }

  saveSession(session: PracticeSession): void {
    this.upsert(session);
  }

  getSession(sessionId: string): PracticeSession | undefined {
    return this.readPayload().sessions.find((session) => session.id === sessionId);
  }

  listSessions(): PracticeSessionListItem[] {
    return this.readPayload().sessions
      .map(toListItem)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  updateSession(session: PracticeSession): void {
    this.upsert(session);
  }

  deleteSession(sessionId: string): void {
    const payload = this.readPayload();
    this.writePayload({
      ...payload,
      sessions: payload.sessions.filter((session) => session.id !== sessionId),
      updatedAt: nowIso(),
    });
  }

  getAllSessionsForTest(): PracticeSession[] {
    return this.readPayload().sessions;
  }

  private upsert(rawSession: PracticeSession): void {
    assertNoForbiddenData(rawSession);
    try {
      const session = practiceSessionSchema.parse(rawSession);
      const payload = this.readPayload();
      const nextSessions = payload.sessions.filter((item) => item.id !== session.id);
      nextSessions.push(session);
      this.writePayload({
        version: PRACTICE_HISTORY_STORAGE_VERSION,
        sessions: pruneSessions(nextSessions),
        updatedAt: nowIso(),
      });
    } catch (error) {
      if (error instanceof PracticeHistoryStorageError) {
        throw error;
      }
      throw new PracticeHistoryStorageError(
        "schema_validation_failed",
        error instanceof Error ? error.message : "Invalid session",
      );
    }
  }

  private readPayload(): PracticeHistoryPayload {
    if (!this.storage) {
      throw new PracticeHistoryStorageError(
        "storage_unavailable",
        "localStorage is unavailable",
      );
    }
    const raw = this.storage.getItem(PRACTICE_HISTORY_STORAGE_KEY);
    if (!raw) {
      return {
        version: PRACTICE_HISTORY_STORAGE_VERSION,
        sessions: [],
        updatedAt: nowIso(),
      };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new PracticeHistoryStorageError(
        "parse_failed",
        error instanceof Error ? error.message : "Invalid JSON",
      );
    }
    try {
      return practiceHistoryPayloadSchema.parse(parsed);
    } catch (error) {
      throw new PracticeHistoryStorageError(
        "schema_validation_failed",
        error instanceof Error ? error.message : "Invalid payload",
      );
    }
  }

  private writePayload(payload: PracticeHistoryPayload): void {
    if (!this.storage) {
      throw new PracticeHistoryStorageError(
        "storage_unavailable",
        "localStorage is unavailable",
      );
    }
    try {
      this.storage.setItem(PRACTICE_HISTORY_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      throw new PracticeHistoryStorageError(
        "quota_exceeded",
        error instanceof Error ? error.message : "Unable to write storage",
      );
    }
  }
}

export function pruneSessions(sessions: PracticeSession[]): PracticeSession[] {
  let next = [...sessions].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  const failed = next.filter((session) => session.status === "failed");
  const failedToRemove = failed.slice(0, Math.max(0, failed.length - 10));
  const failedRemoveIds = new Set(failedToRemove.map((session) => session.id));
  next = next.filter((session) => !failedRemoveIds.has(session.id));

  while (next.length > 50) {
    const removableIndex = next.findIndex(
      (session) => session.status === "completed" || session.status === "abandoned",
    );
    next.splice(removableIndex >= 0 ? removableIndex : 0, 1);
  }
  return next.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
}
