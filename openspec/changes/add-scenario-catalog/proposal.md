## Why

英语陪练 MVP 已经有 Agent Skill 合同来规范“怎么练、怎么评、怎么纠、怎么总结”，但还缺少稳定的场景目录来定义“练什么”。如果场景只是散落的提示词文本，后续 Prompt Builder、Realtime 会话、评测、总结和 badcase 归因都会缺少统一入口。

本变更建立 provider-neutral 的 Scenario Catalog，固定 V1 的五个内置场景，并为三层 Prompt 架构中的 Tier 2 提供结构化场景上下文。

## What Changes

- 新增五个内置场景：
  - `job-interview`
  - `restaurant-ordering`
  - `business-meeting`
  - `airport-travel`
  - `daily-small-talk`
- 新增场景 schema，包含场景 ID、版本、难度、英文上下文、中文 UI 展示文案、学习目标、话题约束、Skill 绑定和 prompt hints。
- 新增统一 Scenario Catalog API：
  - `getAllScenarios`
  - `getScenarioById`
  - `assertScenarioById`
  - `getScenariosByDifficulty`
  - `toScenarioPromptContext`
- 新增校验规则：
  - 场景 ID 唯一。
  - 单个场景内 goal ID 唯一。
  - `skillBindings` 必须引用已知四类 Agent Skill。
  - `maxSessionMinutes` 在合理范围内。
  - `openingMessage`、goals、constraints 和 prompt hints 使用英文。
  - 场景内容不绑定通义、OpenAI、DashScope、WebRTC、WebSocket 或具体模型。
- 明确三层 Prompt 设计：
  - Tier 1：全局英语陪练规则和硬性红线。
  - Tier 2：Scenario + 当前 Agent Skill。
  - Tier 3：Runtime State、Transcript、Assessment、Correction。
- 本变更只实现 Tier 2 中 Scenario 的结构化输入，不实现 Prompt Builder。

## Capabilities

### New Capabilities

- `scenario-catalog`: 定义英语口语陪练场景目录、场景 schema、五个内置场景、场景查询接口和 Scenario Prompt Context 输出合同。

### Modified Capabilities

- 无。

## Impact

- 新增 `src/scenarios/*.json`，作为 V1 静态场景配置。
- 新增 `src/lib/scenarios/`，提供 schema、catalog 查询接口和 prompt context 转换。
- 后续 `add-prompt-context-builder` 将消费 `ScenarioPromptContext`，组合 Agent Skills 和 Runtime State。
- 后续 `add-model-provider-abstraction` 可选择通义、OpenAI 或 mock provider；本变更不写死任何模型供应商。
- 后续 `add-file-badcase-log` 可使用 `scenarioId`、`scenarioVersion` 和 `goalId` 做失败样本归因。
