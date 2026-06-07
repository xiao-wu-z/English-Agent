import { randomUUID } from "node:crypto";
import {
  type CorrectionItem,
  type PracticeTurnGuidance,
  type PracticeSummary,
} from "../agent-skill-contracts/schema.ts";
import {
  assertScenarioById,
  toScenarioPromptContext,
} from "../scenarios/index.ts";
import {
  assertSessionTransition,
  buildConversationMemorySnapshot,
  type PracticeSession,
  type PracticeTurn,
} from "../practice-session/index.ts";
import { LocalPracticeSessionRepository } from "../practice-history/index.ts";
import { resolveTextProvider } from "../model-providers/server/index.ts";
import { decideFromQualityGate, defaultReactLoopPolicy } from "../react-orchestration/index.ts";
import {
  createTextPracticeSessionRequestSchema,
  endTextPracticeSessionRequestSchema,
  submitTextPracticeTurnRequestSchema,
  TextPracticeFlowError,
  type CreateTextPracticeSessionRequest,
  type EndTextPracticeSessionRequest,
  type SubmitTextPracticeTurnRequest,
} from "./types.ts";

const sessions = new Map<string, PracticeSession>();

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export function getTextPracticeSession(sessionId: string): PracticeSession | undefined {
  return sessions.get(sessionId);
}

export async function createTextPracticeSession(
  request: CreateTextPracticeSessionRequest,
) {
  const parsed = createTextPracticeSessionRequestSchema.parse(request);
  const scenario = assertScenarioById(parsed.scenarioId);
  const now = nowIso();
  const session: PracticeSession = {
    id: createId("session"),
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    status: "active",
    createdAt: now,
    startedAt: now,
    updatedAt: now,
    turns: [],
  };
  sessions.set(session.id, session);
  return { session, scenario };
}

export async function submitTextPracticeTurn(
  request: SubmitTextPracticeTurnRequest,
) {
  const parsed = submitTextPracticeTurnRequestSchema.parse(request);
  if (parsed.userText.trim().length === 0) {
    throw new TextPracticeFlowError("empty_user_text", 400, "User text is empty");
  }
  const session = sessions.get(parsed.sessionId);
  if (!session) {
    throw new TextPracticeFlowError("session_not_found", 404, "Session not found");
  }
  if (session.status !== "active") {
    throw new TextPracticeFlowError("session_not_active", 409, "Session is not active");
  }
  const scenario = assertScenarioById(session.scenarioId);
  const provider = resolveTextProvider({});
  const guidance = await provider.generateJson<PracticeTurnGuidance>({
    messages: [
      {
        role: "user",
        content: `Scenario: ${scenario.title}. Learner: ${parsed.userText}`,
      },
    ],
    expectedOutputSchemaName: "practiceTurnGuidance",
  });
  const correction = buildOptionalCorrection(parsed.userText);
  const correctionDecision = decideFromQualityGate({
    schemaValid: true,
    confidenceLabel: correction ? correction.confidenceLabel : "medium",
    riskLevel: "low",
    hallucinationRisk: "low",
    retryCount: 0,
    providerFailureCount: 0,
    policy: defaultReactLoopPolicy,
    maxStepsReached: false,
    sessionStatus: session.status,
  });
  const aiReply = renderMockAiReply(
    scenario.context.aiRole,
    guidance.parsed.spokenReplyGuidance,
  );
  const now = nowIso();
  const turn: PracticeTurn = {
    id: createId("turn"),
    sessionId: session.id,
    startedAt: now,
    endedAt: now,
    userText: parsed.userText.trim(),
    aiText: aiReply,
    candidateIssues: guidance.parsed.candidateIssues,
    realtimeCorrection: correctionDecision.action === "show" ? correction : undefined,
  };
  const updated: PracticeSession = {
    ...session,
    turns: [...session.turns, turn],
    updatedAt: now,
  };
  sessions.set(session.id, updated);
  buildConversationMemorySnapshot(updated);
  toScenarioPromptContext(scenario);
  return {
    session: updated,
    turn,
    aiReply,
    correctionDecision,
    realtimeCorrection: turn.realtimeCorrection,
  };
}

export async function endTextPracticeSession(
  request: EndTextPracticeSessionRequest,
) {
  const parsed = endTextPracticeSessionRequestSchema.parse(request);
  const session = sessions.get(parsed.sessionId);
  if (!session) {
    throw new TextPracticeFlowError("session_not_found", 404, "Session not found");
  }
  if (session.status !== "active") {
    throw new TextPracticeFlowError("session_not_active", 409, "Session is not active");
  }
  assertSessionTransition("active", "ending");
  const ending: PracticeSession = {
    ...session,
    status: "ending",
    updatedAt: nowIso(),
  };
  const provider = resolveTextProvider({});
  const summaryResult = await provider.generateJson<PracticeSummary>({
    messages: [{ role: "user", content: `Summarize ${ending.turns.length} turns.` }],
    expectedOutputSchemaName: "practiceSummary",
  });
  const summary: PracticeSummary = {
    ...summaryResult.parsed,
    sessionId: session.id,
    correctedSentences: ending.turns
      .map((turn) => turn.realtimeCorrection)
      .filter((item): item is CorrectionItem => Boolean(item)),
  };
  assertSessionTransition("ending", "completed");
  const completed: PracticeSession = {
    ...ending,
    status: "completed",
    finalSummary: summary,
    endedAt: nowIso(),
    updatedAt: nowIso(),
  };
  sessions.set(session.id, completed);
  let savedToHistory = true;
  try {
    new LocalPracticeSessionRepository(createMemoryStorage()).saveSession(completed);
  } catch {
    savedToHistory = false;
  }
  return {
    session: completed,
    summary,
    savedToHistory,
  };
}

function renderMockAiReply(aiRole: string, guidance: string): string {
  if (aiRole === "Waiter") {
    return "Sure. What would you like to order today?";
  }
  if (aiRole === "Interviewer") {
    return "Thanks. Could you tell me about one project you are proud of?";
  }
  return guidance.replace(/^Ask /i, "Could you ");
}

function buildOptionalCorrection(userText: string): CorrectionItem | undefined {
  if (!/\bi want\b/i.test(userText)) {
    return undefined;
  }
  return {
    id: createId("correction"),
    turnId: "turn-1",
    type: "expression",
    original: userText,
    corrected: userText.replace(/\bi want\b/i, "I'd like"),
    explanation: "这里用 I'd like 会更自然、更礼貌，适合口语场景。",
    severity: "medium",
    displayTiming: "after_turn",
    confidenceLabel: "high",
    action: "show",
  };
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}
