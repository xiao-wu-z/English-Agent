import type { BadcaseHint } from "../badcases/schema.ts";
import type { ConversationMemorySnapshot } from "../practice-session/schema.ts";
import type { ScenarioPromptContext } from "../scenarios/schema.ts";

export type PromptMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type PromptContextMetadata = {
  scenarioId: string;
  scenarioVersion: string;
  skillId: string;
  includedTiers: Array<"tier1" | "tier2" | "tier3">;
  recentTurnCount: number;
  badcaseHintCount: number;
  estimatedChars: number;
  expectedOutputSchemaName: string;
};

export type PromptContextBundle = {
  tier1: {
    coreRules: string[];
  };
  tier2: {
    scenario: ScenarioPromptContext;
    activeSkill: {
      skillId: string;
      instruction: string;
    };
    expectedOutputSchemaName: string;
  };
  tier3: {
    memory: ConversationMemorySnapshot;
    badcaseHints: BadcaseHint[];
    currentTaskInput: string;
  };
  expectedOutputSchemaName: string;
  metadata: PromptContextMetadata;
};

export type BuildPromptContextInput = {
  coreRules: string[];
  scenario: ScenarioPromptContext;
  activeSkill: {
    skillId: string;
    instruction: string;
  };
  memory: ConversationMemorySnapshot;
  badcaseHints: BadcaseHint[];
  currentTaskInput: string;
  expectedOutputSchemaName: string;
  options?: {
    recentTurnLimit?: number;
    badcaseHintLimit?: number;
  };
};
