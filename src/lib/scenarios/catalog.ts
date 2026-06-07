import airportTravel from "../../scenarios/airport-travel.json" with { type: "json" };
import businessMeeting from "../../scenarios/business-meeting.json" with { type: "json" };
import dailySmallTalk from "../../scenarios/daily-small-talk.json" with { type: "json" };
import jobInterview from "../../scenarios/job-interview.json" with { type: "json" };
import restaurantOrdering from "../../scenarios/restaurant-ordering.json" with { type: "json" };
import {
  type Scenario,
  type ScenarioDifficulty,
  type ScenarioPromptContext,
  scenarioPromptContextSchema,
  validateScenarioCatalog,
} from "./schema.ts";

const scenarios = validateScenarioCatalog([
  jobInterview,
  restaurantOrdering,
  businessMeeting,
  airportTravel,
  dailySmallTalk,
]);

export function getAllScenarios(): Scenario[] {
  return scenarios;
}

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}

export function assertScenarioById(id: string): Scenario {
  const scenario = getScenarioById(id);
  if (!scenario) {
    throw new Error(`Unknown scenario id: ${id}`);
  }
  return scenario;
}

export function getScenariosByDifficulty(
  difficulty: ScenarioDifficulty,
): Scenario[] {
  return scenarios.filter((scenario) => scenario.difficulty === difficulty);
}

export function toScenarioPromptContext(
  scenario: Scenario,
): ScenarioPromptContext {
  return scenarioPromptContextSchema.parse({
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    setting: scenario.context.setting,
    aiRole: scenario.context.aiRole,
    userRole: scenario.context.userRole,
    learnerPurpose: scenario.context.learnerPurpose,
    goals: scenario.goals,
    constraints: scenario.constraints,
    vocabulary: scenario.promptHints.vocabulary,
    sampleUserIntents: scenario.promptHints.sampleUserIntents,
    tone: scenario.promptHints.tone,
  });
}
