import type {
  ConversationMemorySnapshot,
  PracticeSession,
} from "./schema.ts";

export function estimateConversationChars(session: PracticeSession): number {
  return session.turns.reduce(
    (sum, turn) => sum + turn.userText.length + turn.aiText.length,
    0,
  );
}

export function shouldCompressConversation(session: PracticeSession): boolean {
  return session.turns.length > 8 || estimateConversationChars(session) > 12000;
}

export function buildConversationMemorySnapshot(
  session: PracticeSession,
  options: {
    recentTurnLimit?: number;
    currentUserInput?: string;
  } = {},
): ConversationMemorySnapshot {
  const recentTurnLimit = options.recentTurnLimit ?? 6;
  if (recentTurnLimit <= 0) {
    throw new Error("recentTurnLimit must be positive");
  }
  return {
    rollingSummary: session.rollingSummary,
    recentTurns: session.turns.slice(-recentTurnLimit),
    currentUserInput: options.currentUserInput,
  };
}
