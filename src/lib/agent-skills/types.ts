import type { ExpectedOutputSchemaName } from "../model-providers/types.ts";
import type { PromptMessage } from "../prompt-context/types.ts";
import type { ConversationMemorySnapshot } from "../practice-session/schema.ts";
import type { ScenarioPromptContext } from "../scenarios/schema.ts";

export type AgentSkillTask = "practice" | "assessment" | "correction" | "summary";
export type AgentSkillId =
  | "english-practice"
  | "english-assessment"
  | "english-correction"
  | "english-summary";

export type AgentSkillHandler = {
  task: AgentSkillTask;
  skillId: AgentSkillId;
  providerMode: "text" | "realtime";
  expectedOutputSchemaName: ExpectedOutputSchemaName;
  buildInstruction(input: { skillMarkdown: string }): string;
};

export type SkillRunRequest = {
  task: AgentSkillTask;
  skillId: AgentSkillId;
  providerMode: "text" | "realtime";
  messages: PromptMessage[];
  expectedOutputSchemaName: ExpectedOutputSchemaName;
};

export type RunAgentSkillInput = {
  task: AgentSkillTask;
  skillId: AgentSkillId;
  scenario: ScenarioPromptContext;
  runtimeState: {
    memory: ConversationMemorySnapshot;
    currentTaskInput: string;
  };
};
