## 1. Runtime 类型与 Schema

- [ ] 1.1 创建 `src/lib/agent-skills/types.ts`，定义 `AgentSkillTask`、`PromptMessage`、`RuntimePromptState`、`SkillRunRequest`、`AgentSkillHandler` 和 expected output schema name 类型。
- [ ] 1.2 用 Zod 定义 runtime state schema，复用 `agent-skill-contracts` 中的 candidate issue、assessment result、correction item 合同。
- [ ] 1.3 定义 transcript turn schema，包含 id、role、text、createdAt。

## 2. Core Coach Rules

- [ ] 2.1 创建 `src/lib/agent-skills/core-rules.ts`，定义 `CORE_COACH_RULES`。
- [ ] 2.2 确认 T1 只包含英语陪练身份、硬性红线和系统边界，不包含具体场景、具体 Skill 文档或 provider 信息。

## 3. Handler Shell 与 Registry

- [ ] 3.1 创建 `src/lib/agent-skills/handlers.ts`，定义 `english-practice`、`english-assessment`、`english-correction`、`english-summary` 四个 handler shell。
- [ ] 3.2 每个 handler 声明 task、skillId、providerMode、expectedOutputSchema 和 `buildInstruction`。
- [ ] 3.3 创建 `src/lib/agent-skills/registry.ts`，实现静态 registry、`getAgentSkillHandler` 和 unknown skill 错误。

## 4. Skill Loader

- [ ] 4.1 创建 `src/lib/agent-skills/loader.server.ts`，按 skill id 读取单个 `agent-skills/<skillId>/SKILL.md`。
- [ ] 4.2 确认 loader 缺文件时抛出包含 skill id 和路径的清晰错误。
- [ ] 4.3 确认 loader 不导入到前端可用入口，避免 `fs/promises` 进入 client bundle。

## 5. Prompt Context Builder 与 Runner

- [ ] 5.1 创建 `src/lib/agent-skills/prompt-context.ts`，实现 T1/T2/T3 provider-neutral messages 构建。
- [ ] 5.2 创建 `src/lib/agent-skills/runner.server.ts`，实现 `runAgentSkill`：解析 scenario skill binding、校验 handler task、加载 active Skill、构建 messages、返回 `SkillRunRequest`。
- [ ] 5.3 创建 `src/lib/agent-skills/index.ts`，统一导出不依赖 fs 的类型、schema、registry 和常量。

## 6. 测试

- [ ] 6.1 创建 `src/lib/agent-skills/runner.test.ts`，验证 practice task 只加载 `english-practice`，不包含 assessment/correction/summary Skill 文档。
- [ ] 6.2 测试 summary task 只加载 `english-summary`，providerMode 为 `text`，expectedOutputSchema 为 `practiceSummary`。
- [ ] 6.3 测试 messages 包含 T1 Core Coach Rules、T2 Scenario Prompt Context + Active Skill、T3 Runtime State。
- [ ] 6.4 测试 unknown skill、task/handler mismatch、缺失 Skill 文档和非法 runtime state 会失败。
- [ ] 6.5 测试 `SkillRunRequest` 不包含 API key、endpoint、model name 或 provider-specific transport 字段。

## 7. 验证

- [ ] 7.1 运行 `npm test`，确认现有测试和 runtime 新测试均通过。
- [ ] 7.2 运行 `npm run lint`，确认新增 TypeScript 不引入 lint 错误。
- [ ] 7.3 运行 `npm run build`，确认 Next.js 项目可构建。
- [ ] 7.4 运行 `openspec status --change add-agent-skill-runtime`，确认 proposal、design、specs、tasks 均已就绪。
