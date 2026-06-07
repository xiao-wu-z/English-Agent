import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { AgentSkillId } from "../types.ts";

export async function loadAgentSkillMarkdown(skillId: AgentSkillId): Promise<string> {
  const filePath = join(process.cwd(), "agent-skills", skillId, "SKILL.md");
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Missing SKILL.md for ${skillId} at ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
