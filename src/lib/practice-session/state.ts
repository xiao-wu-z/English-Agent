import type { PracticeSessionStatus } from "./schema.ts";

const transitions: Record<PracticeSessionStatus, PracticeSessionStatus[]> = {
  created: ["active", "abandoned"],
  active: ["ending", "abandoned", "failed"],
  ending: ["completed", "failed"],
  completed: [],
  abandoned: [],
  failed: [],
};

export function canTransitionSession(
  from: PracticeSessionStatus,
  to: PracticeSessionStatus,
): boolean {
  return transitions[from].includes(to);
}

export function assertSessionTransition(
  from: PracticeSessionStatus,
  to: PracticeSessionStatus,
): void {
  if (!canTransitionSession(from, to)) {
    throw new Error(`Invalid session transition: ${from} -> ${to}`);
  }
}
