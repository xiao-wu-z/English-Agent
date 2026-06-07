import { buildPromptContextBundle, renderPromptMessages } from "../../prompt-context/index.ts";
import { CORE_COACH_RULES } from "../core-rules.ts";
import { getAgentSkillHandler } from "../registry.ts";
import type { RunAgentSkillInput, SkillRunRequest } from "../types.ts";
import { loadAgentSkillMarkdown } from "./loader.ts";

export async function runAgentSkill(
  input: RunAgentSkillInput,
): Promise<SkillRunRequest> {
  const handler = getAgentSkillHandler(input.skillId);
  if (handler.task !== input.task) {
    throw new Error(`Skill ${input.skillId} does not handle task ${input.task}`);
  }
  const skillMarkdown = await loadAgentSkillMarkdown(input.skillId);
  const bundle = buildPromptContextBundle({
    coreRules: CORE_COACH_RULES,
    scenario: input.scenario,
    activeSkill: {
      skillId: handler.skillId,
      instruction: handler.buildInstruction({ skillMarkdown }),
    },
    memory: input.runtimeState.memory,
    badcaseHints: [],
    currentTaskInput: input.runtimeState.currentTaskInput,
    expectedOutputSchemaName: handler.expectedOutputSchemaName,
  });
  return {
    task: handler.task,
    skillId: handler.skillId,
    providerMode: handler.providerMode,
    messages: renderPromptMessages(bundle),
    expectedOutputSchemaName: handler.expectedOutputSchemaName,
  };
}
