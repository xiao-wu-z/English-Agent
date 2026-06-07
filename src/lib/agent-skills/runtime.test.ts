import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAgentSkillHandler,
  loadAgentSkillMarkdown,
  runAgentSkill,
} from "./server/index.ts";
import { assertScenarioById, toScenarioPromptContext } from "../scenarios/index.ts";

describe("agent skill runtime", () => {
  it("loads only the active skill and builds provider-neutral request", async () => {
    const scenario = toScenarioPromptContext(assertScenarioById("restaurant-ordering"));
    const markdown = await loadAgentSkillMarkdown("english-practice");
    assert.match(markdown, /Purpose/);
    const handler = getAgentSkillHandler("english-practice");
    assert.equal(handler.expectedOutputSchemaName, "practiceTurnGuidance");
    const request = await runAgentSkill({
      task: "practice",
      skillId: "english-practice",
      scenario,
      runtimeState: { memory: { recentTurns: [] }, currentTaskInput: "Start." },
    });
    assert.equal(request.skillId, "english-practice");
    assert.equal(request.expectedOutputSchemaName, "practiceTurnGuidance");
    assert.equal(request.messages.some((message) => message.content.includes("english-summary")), false);
  });
});
