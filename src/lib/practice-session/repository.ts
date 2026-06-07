import type { PracticeSession } from "./schema.ts";

export type PracticeSessionRepository = {
  saveSession(session: PracticeSession): Promise<void> | void;
  getSession(sessionId: string): Promise<PracticeSession | undefined> | PracticeSession | undefined;
  listSessions(): Promise<PracticeSession[]> | PracticeSession[];
  updateSession(session: PracticeSession): Promise<void> | void;
  deleteSession(sessionId: string): Promise<void> | void;
};
