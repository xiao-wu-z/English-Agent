import type { PromptContextBundle, PromptMessage } from "./types.ts";

export function renderPromptMessages(bundle: PromptContextBundle): PromptMessage[] {
  return [
    {
      role: "system",
      content: [
        "[Tier 1] Core Coach Rules",
        ...bundle.tier1.coreRules.map((rule) => `- ${rule}`),
      ].join("\n"),
    },
    {
      role: "system",
      content: [
        "[Tier 2] Scenario Context",
        JSON.stringify(bundle.tier2.scenario),
        "[Tier 2] Active Skill Instruction",
        `Skill: ${bundle.tier2.activeSkill.skillId}`,
        bundle.tier2.activeSkill.instruction,
        `[Tier 2] Expected Output Schema: ${bundle.tier2.expectedOutputSchemaName}`,
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        "[Tier 3] Conversation Memory Snapshot",
        JSON.stringify(bundle.tier3.memory),
        "[Tier 3] Relevant Badcase Hints",
        JSON.stringify(bundle.tier3.badcaseHints),
        "[Tier 3] Current Task Input",
        bundle.tier3.currentTaskInput,
      ].join("\n"),
    },
  ];
}
