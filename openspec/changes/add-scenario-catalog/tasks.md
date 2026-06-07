## 1. 场景 Schema

- [ ] 1.1 创建 `src/lib/scenarios/schema.ts`，定义 difficulty、tone、skill binding、goal、constraints、prompt hints、scenario 和 scenario prompt context 的 Zod schema 与 TypeScript 类型。
- [ ] 1.2 在 schema 中实现 prompt-facing 英文字段校验、provider-neutral 禁词校验、goal id 唯一校验和 `maxSessionMinutes` 3-20 分钟范围校验。

## 2. 内置场景配置

- [ ] 2.1 创建 `src/scenarios/job-interview.json`，包含英文上下文、中文 UI 文案、学习目标、约束、默认 Agent Skill 绑定和 prompt hints。
- [ ] 2.2 创建 `src/scenarios/restaurant-ordering.json`，包含英文上下文、中文 UI 文案、学习目标、约束、默认 Agent Skill 绑定和 prompt hints。
- [ ] 2.3 创建 `src/scenarios/business-meeting.json`，包含英文上下文、中文 UI 文案、学习目标、约束、默认 Agent Skill 绑定和 prompt hints。
- [ ] 2.4 创建 `src/scenarios/airport-travel.json`，包含英文上下文、中文 UI 文案、学习目标、约束、默认 Agent Skill 绑定和 prompt hints。
- [ ] 2.5 创建 `src/scenarios/daily-small-talk.json`，包含英文上下文、中文 UI 文案、学习目标、约束、默认 Agent Skill 绑定和 prompt hints。

## 3. Catalog API

- [ ] 3.1 创建 `src/lib/scenarios/catalog.ts`，导入五个 JSON，完成 catalog-level 校验并暴露 `getAllScenarios`。
- [ ] 3.2 实现 `getScenarioById`、`assertScenarioById` 和 `getScenariosByDifficulty`。
- [ ] 3.3 实现 `toScenarioPromptContext`，输出三层 Prompt 架构中的 Tier 2 Scenario 上下文，不拼完整 prompt。
- [ ] 3.4 创建 `src/lib/scenarios/index.ts`，统一导出 schema、类型和 catalog API。

## 4. 测试

- [ ] 4.1 创建 `src/lib/scenarios/schema.test.ts`，验证五个内置场景都能通过 schema 和 catalog 校验。
- [ ] 4.2 测试 catalog API：列出全部场景、按 ID 查询、未知 ID 严格查询报错、按难度过滤。
- [ ] 4.3 测试 catalog invariants：重复 scenario id、重复 goal id、未知 skill id、provider/transport 禁词、非英文 prompt-facing 字段会失败。
- [ ] 4.4 测试 `toScenarioPromptContext` 输出包含 `scenarioId`、`scenarioVersion`、roles、goals、constraints、vocabulary、sampleUserIntents 和 tone。

## 5. 验证

- [ ] 5.1 运行 `npm test`，确认 agent-skill-contracts 和 scenario tests 均通过。
- [ ] 5.2 运行 `npm run lint`，确认新增 TypeScript 不引入 lint 错误。
- [ ] 5.3 运行 `npm run build`，确认 Next.js 项目可构建。
- [ ] 5.4 运行 `openspec status --change add-scenario-catalog`，确认 proposal、design、specs、tasks 均已就绪。
