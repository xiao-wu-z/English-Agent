import { agentSkillHandlers } from "./handlers.ts";
import type { AgentSkillHandler, AgentSkillId } from "./types.ts";

export function getAgentSkillHandler(skillId: AgentSkillId): AgentSkillHandler {
  const handler = agentSkillHandlers.find((item) => item.skillId === skillId);
  if (!handler) {
    throw new Error(`Unknown Agent Skill id: ${skillId}`);
  }
  return handler;
}
