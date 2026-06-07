import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertScenarioById,
  getAllScenarios,
  getScenarioById,
  getScenariosByDifficulty,
  toScenarioPromptContext,
  validateScenarioCatalog,
} from "./index.ts";

const skillBindings = {
  practice: "english-practice",
  assessment: "english-assessment",
  correction: "english-correction",
  summary: "english-summary",
} as const;

const sampleScenario = {
  id: "sample",
  version: "1.0.0",
  title: "Sample",
  titleZh: "示例",
  description: "Practice a short English conversation.",
  descriptionZh: "练习一段简短英文对话。",
  difficulty: "beginner",
  maxSessionMinutes: 8,
  context: {
    setting: "A friendly conversation at a community event.",
    aiRole: "Host",
    userRole: "Visitor",
    learnerPurpose: "Start a conversation and answer simple questions.",
  },
  goals: [
    {
      id: "greet",
      label: "Use a natural greeting",
      successCriteria: ["Use a greeting", "Ask one follow-up question"],
    },
  ],
  constraints: ["Ask one question at a time."],
  promptHints: {
    tone: "friendly",
    vocabulary: ["hello", "nice to meet you"],
    sampleUserIntents: ["Say hello"],
  },
  skillBindings,
};

describe("scenario catalog", () => {
  it("loads five built-in provider-neutral scenarios", () => {
    const ids = getAllScenarios().map((scenario) => scenario.id).sort();
    assert.deepEqual(ids, [
      "airport-travel",
      "business-meeting",
      "daily-small-talk",
      "job-interview",
      "restaurant-ordering",
    ]);
    assert.equal(assertScenarioById("job-interview").titleZh, "求职面试");
    assert.equal(getScenarioById("missing"), undefined);
    assert.throws(() => assertScenarioById("missing"), /Unknown scenario id/);
  });

  it("filters and builds Tier 2 scenario prompt context", () => {
    assert.deepEqual(
      getScenariosByDifficulty("beginner").map((scenario) => scenario.id).sort(),
      ["daily-small-talk", "restaurant-ordering"],
    );
    const context = toScenarioPromptContext(assertScenarioById("airport-travel"));
    assert.equal(context.scenarioId, "airport-travel");
    assert.equal(context.scenarioVersion, "1.0.0");
    assert.equal(context.aiRole, "Airport ground staff");
    assert.ok(context.vocabulary.includes("boarding pass"));
  });

  it("rejects duplicate ids, unknown skills, provider words, Chinese prompt text, and bad duration", () => {
    assert.throws(
      () => validateScenarioCatalog([sampleScenario, sampleScenario]),
      /Duplicate scenario id: sample/,
    );
    assert.throws(
      () =>
        validateScenarioCatalog([
          {
            ...sampleScenario,
            goals: [sampleScenario.goals[0], sampleScenario.goals[0]],
          },
        ]),
      /Duplicate goal id/,
    );
    assert.throws(
      () =>
        validateScenarioCatalog([
          {
            ...sampleScenario,
            skillBindings: { ...skillBindings, practice: "unknown" },
          },
        ]),
      /Unknown skill id/,
    );
    assert.throws(
      () =>
        validateScenarioCatalog([
          {
            ...sampleScenario,
            context: { ...sampleScenario.context, setting: "Use WebSocket." },
          },
        ]),
      /Provider-neutral violation/,
    );
    assert.throws(
      () =>
        validateScenarioCatalog([
          { ...sampleScenario, constraints: ["请用英文练习。"] },
        ]),
      /Prompt-facing content must be English/,
    );
    assert.throws(
      () => validateScenarioCatalog([{ ...sampleScenario, maxSessionMinutes: 25 }]),
      /maxSessionMinutes/,
    );
  });
});
