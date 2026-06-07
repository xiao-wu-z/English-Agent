import { z } from "zod";

export const difficultySchema = z.enum(["beginner", "intermediate", "advanced"]);
export const toneSchema = z.enum(["friendly", "professional", "helpful"]);

export const knownAgentSkillIds = [
  "english-practice",
  "english-assessment",
  "english-correction",
  "english-summary",
] as const;

const knownAgentSkillIdSet = new Set<string>(knownAgentSkillIds);

export const skillBindingsSchema = z.object({
  practice: z.string().min(1),
  assessment: z.string().min(1),
  correction: z.string().min(1),
  summary: z.string().min(1),
}).strict();

export const scenarioGoalSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  successCriteria: z.array(z.string().min(1)).min(1),
}).strict();

export const scenarioSchema = z.object({
  id: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  title: z.string().min(1),
  titleZh: z.string().min(1),
  description: z.string().min(1),
  descriptionZh: z.string().min(1),
  difficulty: difficultySchema,
  maxSessionMinutes: z.number().int().min(3).max(20),
  context: z.object({
    setting: z.string().min(1),
    aiRole: z.string().min(1),
    userRole: z.string().min(1),
    learnerPurpose: z.string().min(1),
  }).strict(),
  goals: z.array(scenarioGoalSchema).min(1),
  constraints: z.array(z.string().min(1)).min(1),
  promptHints: z.object({
    tone: toneSchema,
    vocabulary: z.array(z.string().min(1)),
    sampleUserIntents: z.array(z.string().min(1)),
  }).strict(),
  skillBindings: skillBindingsSchema,
}).strict();

export const scenarioPromptContextSchema = z.object({
  scenarioId: z.string().min(1),
  scenarioVersion: z.string().min(1),
  setting: z.string().min(1),
  aiRole: z.string().min(1),
  userRole: z.string().min(1),
  learnerPurpose: z.string().min(1),
  goals: z.array(scenarioGoalSchema),
  constraints: z.array(z.string()),
  vocabulary: z.array(z.string()),
  sampleUserIntents: z.array(z.string()),
  tone: toneSchema,
}).strict();

export type ScenarioDifficulty = z.infer<typeof difficultySchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type ScenarioPromptContext = z.infer<typeof scenarioPromptContextSchema>;

const cjkPattern = /[\u3400-\u9fff]/u;
const providerPattern = /\b(qwen|tongyi|openai|dashscope|webrtc|websocket|model|api key|endpoint)\b/i;

function flattenPromptFacingText(scenario: Scenario): string[] {
  return [
    scenario.title,
    scenario.description,
    scenario.context.setting,
    scenario.context.aiRole,
    scenario.context.userRole,
    scenario.context.learnerPurpose,
    ...scenario.goals.flatMap((goal) => [
      goal.label,
      ...goal.successCriteria,
    ]),
    ...scenario.constraints,
    ...scenario.promptHints.vocabulary,
    ...scenario.promptHints.sampleUserIntents,
  ];
}

export function validateScenarioCatalog(rawScenarios: unknown[]): Scenario[] {
  const scenarios = rawScenarios.map((raw) => scenarioSchema.parse(raw));
  const ids = new Set<string>();
  for (const scenario of scenarios) {
    if (ids.has(scenario.id)) {
      throw new Error(`Duplicate scenario id: ${scenario.id}`);
    }
    ids.add(scenario.id);
    const goalIds = new Set<string>();
    for (const goal of scenario.goals) {
      if (goalIds.has(goal.id)) {
        throw new Error(`Duplicate goal id "${goal.id}" in scenario ${scenario.id}`);
      }
      goalIds.add(goal.id);
    }
    for (const skillId of Object.values(scenario.skillBindings)) {
      if (!knownAgentSkillIdSet.has(skillId)) {
        throw new Error(`Unknown skill id "${skillId}" in scenario ${scenario.id}`);
      }
    }
    for (const text of flattenPromptFacingText(scenario)) {
      if (cjkPattern.test(text)) {
        throw new Error(`Prompt-facing content must be English in scenario ${scenario.id}`);
      }
      if (providerPattern.test(text)) {
        throw new Error(`Provider-neutral violation in scenario ${scenario.id}`);
      }
    }
  }
  return scenarios;
}
