import type { VoicePracticeUiStatus } from "./state.ts";

type CorrectionCandidate = {
  explanation: string;
  confidenceLabel: "high" | "medium" | "low";
  riskLevel: "low" | "medium" | "high";
};

export function decideRealtimeCorrectionDisplay(input: {
  uiStatus: VoicePracticeUiStatus;
  transcriptFinal: boolean;
  corrections: CorrectionCandidate[];
}): { action: "show"; correction: CorrectionCandidate } | { action: "defer_to_summary" } {
  if (!input.transcriptFinal || input.uiStatus === "listening") {
    return { action: "defer_to_summary" };
  }
  const correction = input.corrections.find(
    (item) => item.confidenceLabel === "high" && item.riskLevel !== "high",
  );
  if (!correction) {
    return { action: "defer_to_summary" };
  }
  return { action: "show", correction };
}
