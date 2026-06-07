import type { AgentSkillHandler } from "./types.ts";

function markdownInstruction(markdown: string): string {
  return markdown;
}

export const agentSkillHandlers: AgentSkillHandler[] = [
  {
    task: "practice",
    skillId: "english-practice",
    providerMode: "text",
    expectedOutputSchemaName: "practiceTurnGuidance",
    buildInstruction: ({ skillMarkdown }) => markdownInstruction(skillMarkdown),
  },
  {
    task: "assessment",
    skillId: "english-assessment",
    providerMode: "text",
    expectedOutputSchemaName: "assessmentResult",
    buildInstruction: ({ skillMarkdown }) => markdownInstruction(skillMarkdown),
  },
  {
    task: "correction",
    skillId: "english-correction",
    providerMode: "text",
    expectedOutputSchemaName: "correctionItem",
    buildInstruction: ({ skillMarkdown }) => markdownInstruction(skillMarkdown),
  },
  {
    task: "summary",
    skillId: "english-summary",
    providerMode: "text",
    expectedOutputSchemaName: "practiceSummary",
    buildInstruction: ({ skillMarkdown }) => markdownInstruction(skillMarkdown),
  },
];
