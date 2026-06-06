## Why

当前项目已经有 Agent Skill 合同和即将实现的 Scenario Catalog，但还缺少一个运行时外壳来把“当前场景 + 当前 Skill + 运行状态”组合成模型可消费的上下文。没有这个外壳，后续接通义、多模态、Realtime 或 mock provider 时容易重新回到“手写大 prompt”的不稳定模式。

本变更引入 Agent Skill Runtime，把 Skills 设计成独立执行单元：通过 registry 选择 Skill，通过 loader 读取对应 `SKILL.md`，通过三层 Prompt 架构生成 provider-neutral 的 `SkillRunRequest`。

## What Changes

- 新增 Agent Skill Runtime，包含：
  - Skill registry：登记 `english-practice`、`english-assessment`、`english-correction`、`english-summary`。
  - Skill loader：按需读取单个 `agent-skills/**/SKILL.md`，不全量注入所有 Skills。
  - Skill runner：根据 task 和 scenario skill binding 生成 `SkillRunRequest`。
  - Prompt context builder：生成三层 provider-neutral messages。
- 三层 Prompt 架构：
  - Tier 1：Core Coach Rules，包含基本角色、硬性红线和系统边界。
  - Tier 2：Active Single Skill + Scenario Prompt Context。
  - Tier 3：Runtime State，如 transcript、active goal、candidate issues、assessment/correction 数据。
- 新增最小运行时状态 schema：
  - sessionId
  - phase
  - activeGoalId
  - recentTranscript
  - candidateIssues
  - assessmentResults
  - correctionItems
- 新增 handler shell，让每类 Skill 声明：
  - task
  - skillId
  - providerMode
  - expectedOutputSchema
  - task-specific instruction builder
- 输出 `SkillRunRequest`，不调用任何模型。
- 本变更依赖 `add-scenario-catalog` 中的 `ScenarioPromptContext`。

## Capabilities

### New Capabilities

- `agent-skill-runtime`: 定义 Agent Skill registry、loader、runner、handler shell、三层 Prompt Context Builder 和 provider-neutral `SkillRunRequest`。

### Modified Capabilities

- 无。

## Impact

- 新增 `src/lib/agent-skills/` 模块，作为 Agent Skill 执行单元外壳。
- 后续 `add-model-provider-abstraction` 将消费 `SkillRunRequest` 并执行通义、OpenAI 或 mock provider 调用。
- 后续 Realtime 语音链路可以使用 practice skill 生成 realtime provider request。
- 本变更不新增外部依赖，不调用通义/OpenAI，不实现 WebRTC/WebSocket，不实现 UI。
