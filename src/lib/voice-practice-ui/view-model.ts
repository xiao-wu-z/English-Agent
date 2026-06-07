import type { PracticeSummary } from "../agent-skill-contracts/schema.ts";

export function getDifficultyLabel(
  difficulty: "beginner" | "intermediate" | "advanced",
): string {
  return {
    beginner: "入门",
    intermediate: "进阶",
    advanced: "挑战",
  }[difficulty];
}

export function getPrimaryVoiceAction(input: {
  hasSession: boolean;
  isRecording: boolean;
  isEnding: boolean;
}): {
  id: "start_session" | "start_recording" | "stop_recording";
  label: string;
  disabled: boolean;
} {
  if (!input.hasSession) {
    return {
      id: "start_session",
      label: "开始语音练习",
      disabled: input.isEnding,
    };
  }
  if (input.isRecording) {
    return {
      id: "stop_recording",
      label: "停止并发送",
      disabled: input.isEnding,
    };
  }
  return {
    id: "start_recording",
    label: "开始说话",
    disabled: input.isEnding,
  };
}

export function isScenarioSelectionLocked(status: string): boolean {
  return [
    "requesting_microphone",
    "connecting",
    "listening",
    "thinking",
    "speaking",
    "ending",
  ].includes(status);
}

export function getReportScoreRows(
  scores: PracticeSummary["dimensionScores"],
): Array<{ label: string; score: number }> {
  return [
    { label: "流利度", score: scores.fluency },
    { label: "发音清晰度", score: scores.pronunciationClarity },
    { label: "语法", score: scores.grammar },
    { label: "词汇", score: scores.vocabulary },
    { label: "表达自然度", score: scores.expression },
    { label: "连贯性", score: scores.coherence },
  ];
}
