import type {
  BuildPromptContextInput,
  PromptContextBundle,
} from "./types.ts";
import { renderPromptMessages } from "./render.ts";

const providerPattern = /\b(qwen|tongyi|openai|dashscope|webrtc|websocket|model|endpoint|api key)\b/i;

function assertProviderNeutral(value: unknown): void {
  const text = JSON.stringify(value);
  if (providerPattern.test(text)) {
    throw new Error("Provider-neutral violation in prompt context input");
  }
}

export function buildPromptContextBundle(
  input: BuildPromptContextInput,
): PromptContextBundle {
  if (input.coreRules.length === 0) {
    throw new Error("coreRules are required");
  }
  if (!input.scenario.scenarioId || !input.scenario.scenarioVersion) {
    throw new Error("scenario id and version are required");
  }
  if (!input.activeSkill.skillId || !input.activeSkill.instruction) {
    throw new Error("active skill id and instruction are required");
  }
  if (!input.expectedOutputSchemaName) {
    throw new Error("expectedOutputSchemaName is required");
  }
  assertProviderNeutral(input);
  const recentTurnLimit = input.options?.recentTurnLimit ?? 6;
  const badcaseHintLimit = input.options?.badcaseHintLimit ?? 3;
  if (recentTurnLimit <= 0 || badcaseHintLimit <= 0) {
    throw new Error("Prompt context limits must be positive");
  }
  const memory = {
    ...input.memory,
    recentTurns: input.memory.recentTurns.slice(-recentTurnLimit),
  };
  const bundle: PromptContextBundle = {
    tier1: {
      coreRules: [...input.coreRules],
    },
    tier2: {
      scenario: input.scenario,
      activeSkill: input.activeSkill,
      expectedOutputSchemaName: input.expectedOutputSchemaName,
    },
    tier3: {
      memory,
      badcaseHints: input.badcaseHints.slice(0, badcaseHintLimit),
      currentTaskInput: input.currentTaskInput,
    },
    expectedOutputSchemaName: input.expectedOutputSchemaName,
    metadata: {
      scenarioId: input.scenario.scenarioId,
      scenarioVersion: input.scenario.scenarioVersion,
      skillId: input.activeSkill.skillId,
      includedTiers: ["tier1", "tier2", "tier3"],
      recentTurnCount: memory.recentTurns.length,
      badcaseHintCount: Math.min(input.badcaseHints.length, badcaseHintLimit),
      estimatedChars: 0,
      expectedOutputSchemaName: input.expectedOutputSchemaName,
    },
  };
  const estimatedChars = renderPromptMessages(bundle).reduce(
    (sum, message) => sum + message.content.length,
    0,
  );
  return {
    ...bundle,
    metadata: {
      ...bundle.metadata,
      estimatedChars,
    },
  };
}
