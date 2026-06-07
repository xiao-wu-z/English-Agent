## Why

当前英语口语陪练 MVP 已经明确要做实时对话、轻量纠错、评测和课后总结，但如果只依赖场景提示词来控制 Agent 行为，流程稳定性、输出一致性和幻觉控制都会不足。

本变更先建立英语陪练 Agent 的 Skill 合同，用 `SKILL.md` 规范练习、评测、纠错、总结四类 Agent 工作流程，并用结构化数据合同约束这些流程产生的数据，为后续 Realtime、Prompt Builder、质量监督和 UI 展示打基础。

## What Changes

- 新增项目内的英语陪练 Agent Skill 文档目录，放置四个 `SKILL.md`：
  - `english-practice`：规范实时陪练 Agent 如何按场景推进对话。
  - `english-assessment`：规范评测 Agent 如何评估用户表现和 AI 回复质量。
  - `english-correction`：规范纠错 Agent 如何产出实时轻纠错和课后完整纠错。
  - `english-summary`：规范总结 Agent 如何生成课后结构化报告。
- 新增 Agent Skill 输出数据合同，覆盖练习轮次指导、评测结果、质量评估、纠错项和课后总结。
- 明确 Skills 负责规范 Agent 工作流程，Scenario 负责提供练习上下文；后续 Prompt Builder 才负责把 Scenario、Skills 和 Runtime State 组合成模型指令。
- 明确实时纠错采用低打断策略：用户一轮说完后最多展示一条高置信轻纠错，完整纠错进入课后总结。
- 本变更不接入 OpenAI Realtime、不实现 WebRTC、不创建 UI、不执行真实评测/纠错/总结调用。

## Capabilities

### New Capabilities

- `agent-skill-contracts`: 定义英语口语陪练 Agent Skills 的文档结构、工作流程、输入输出数据合同、质量门槛和禁止行为。

### Modified Capabilities

- 无。

## Impact

- 新增 `agent-skills/` 目录，用于存放产品 Agent 的运行规范文档，不放在 `.codex/skills/`，避免和开发代理 Skill 混淆。
- 新增 `src/lib/agent-skill-contracts/` 下的数据 schema 和类型，用于后续 Prompt Builder、Realtime session、Assessment、Correction、Summary 模块消费。
- 后续实现会依赖本变更中的 Skill 合同来创建模型指令和校验结构化输出。
- 不新增运行时第三方依赖；如果使用 Zod，会复用项目已有依赖。
