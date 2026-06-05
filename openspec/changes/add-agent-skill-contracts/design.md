## Context

English-Agent 的核心体验是实时英语口语陪练。此前基准设计已经确定 V1 要包含多场景、实时语音、轻量纠错、结构化总结和本地历史。新的问题是：如果只用场景里的单段提示词控制 AI 行为，练习流程、纠错频率、评测标准、总结结构和幻觉控制都会漂移。

本设计引入项目内的 Agent Skill 合同，用 Markdown `SKILL.md` 规范英语陪练 Agent 的工作方式。这里的 Skill 不是 `.codex/skills/` 里的开发代理技能，而是产品 Agent 的运行规范：它告诉口语陪练 Agent 如何练习、如何评测、如何纠错、如何总结。Scenario 仍负责提供练习上下文，例如餐厅、面试或旅行；Skill 负责规范流程和质量门槛。

## Goals / Non-Goals

**Goals:**

- 建立四个 Agent Skill：`english-practice`、`english-assessment`、`english-correction`、`english-summary`。
- 每个 Skill 使用统一文档结构：Purpose、When To Use、Inputs、Required Process、Output Contract、Quality Gates、Prohibited Behavior、Failure Handling、Examples。
- 定义 Agent Skill 产出的结构化数据合同，后续可以用 Zod 校验。
- 明确实时纠错策略：用户一轮结束后最多展示一条高置信轻纠错，完整纠错进入课后总结。
- 明确评测分数使用 0-100 内部尺度，避免冒充官方考试评分。
- 为后续 Prompt Builder、Realtime session、Assessment、Correction、Summary 模块建立稳定输入输出边界。

**Non-Goals:**

- 不实现 OpenAI Realtime、WebRTC 或 API route。
- 不实现 Prompt Builder。
- 不调用模型执行真实评测、纠错或总结。
- 不创建 UI。
- 不创建登录、数据库、后台管理或课程系统。
- 不实现音素级发音评分。

## Decisions

### Decision 1: Agent Skills 放在 `agent-skills/`

`agent-skills/` 是产品 Agent 运行规范目录，和 `.codex/skills/` 区分开。

替代方案是放进 `.codex/skills/`。这个方案会让它们看起来像开发代理技能，只影响 Codex 工作流，不适合后续应用运行时读取。放在项目根目录的 `agent-skills/` 更清晰，也能让 Prompt Builder 在后续 change 中把这些 Markdown 作为模型指令来源。

### Decision 2: 四个 Skill 分开定义

练习、评测、纠错、总结分别有不同触发条件、输入、输出和质量门槛。拆成四个 Skill 可以避免一个大提示词承担所有职责。

替代方案是一个 `english-coach/SKILL.md` 管全部流程。这个方案初期文件少，但很快会混合实时对话、评分、纠错和总结规则，难以测试和演进。

### Decision 3: Skill 文档约束流程，Schema 约束输出

`SKILL.md` 适合表达 Agent 行为流程、禁止事项和质量门槛；TypeScript/Zod schema 适合约束模型输出数据。两者配合使用：文档减少行为漂移，schema 减少数据漂移。

替代方案是把所有内容都写成 JSON 配置。JSON 更适合运行时数据，但不适合表达复杂 Agent 工作步骤和质量规则。

### Decision 4: 实时纠错采用 after-turn 轻提示

实时纠错是产品亮点，但直接语音打断会破坏口语练习。V1 的纠错 Skill 允许在用户一轮结束后展示一条高置信、价值高的轻纠错；低置信候选纠错不实时展示，完整纠错在课后总结展示。

替代方案是只做课后纠错。它更稳但亮点不足。另一个替代方案是句中打断式纠错，反馈即时但会显著伤害口语流畅性。

### Decision 5: 评测结果不冒充官方考试分数

评测维度参考主流口语学习和考试评测思路，例如 fluency、pronunciation clarity、grammar、vocabulary、coherence、scenario relevance，但输出使用内部 0-100 分数和 confidence/risk 标签，不宣称为 IELTS、TOEFL、CEFR 或音素级评分。

## Data Flow

后续完整链路预期如下：

```text
Scenario
  + agent-skills/english-practice/SKILL.md
  + agent-skills/english-assessment/SKILL.md
  + agent-skills/english-correction/SKILL.md
  + agent-skills/english-summary/SKILL.md
  + Runtime State
        ↓
Prompt Builder
        ↓
Realtime Practice / Assessment / Correction / Summary Agents
        ↓
Structured outputs validated by schemas
        ↓
UI and local history
```

本 change 只建立 `agent-skills/` 文档和输出 schema。Prompt Builder 和实际 Agent 执行在后续 change 中实现。

## Module Boundaries

- `agent-skills/english-practice/SKILL.md`: 规范场景角色扮演、对话推进、回复长度、用户开口优先和候选问题识别。
- `agent-skills/english-assessment/SKILL.md`: 规范用户表现评测、AI 回复质量评估、幻觉风险和置信度标签。
- `agent-skills/english-correction/SKILL.md`: 规范实时轻纠错和课后完整纠错的判断与输出。
- `agent-skills/english-summary/SKILL.md`: 规范课后报告结构和学习建议。
- `src/lib/agent-skill-contracts/schema.ts`: 导出 Zod schema 和 TypeScript 类型，覆盖 Skill 输出数据合同。
- `src/lib/agent-skill-contracts/index.ts`: 统一导出合同类型，后续模块从这里消费。

## Error Handling

本 change 不执行模型调用，但数据合同需要为后续错误处理留边界：

- 低置信评测输出必须有 `confidenceLabel` 和 `riskLevel`。
- 幻觉风险输出不能暴露 chain-of-thought，只能给结构化原因和推荐动作。
- 纠错候选低置信时必须允许 `suppress` 或 `flag_for_summary`。
- 总结不得把缺失 transcript 或缺失 assessment 数据伪装成完整报告；后续实现应失败或返回降级报告。

## Risks / Trade-offs

- [Risk] Skill 文档过长导致后续 prompt 冗余 → Mitigation: 每个 Skill 保持职责单一，Prompt Builder 后续按任务加载必要 Skill。
- [Risk] Markdown Skill 难以机器校验 → Mitigation: Markdown 管流程，schema 管输出；实现时校验结构化数据，不校验自然语言全文。
- [Risk] 实时纠错误导用户 → Mitigation: correction Skill 只允许高置信 after-turn 轻纠错，低置信内容不实时展示。
- [Risk] 评测分数被误解为官方能力等级 → Mitigation: Skill 和 Summary 合同明确禁止官方考试式宣称。

## Migration Plan

这是新增规划和合同层，不需要数据迁移。

实施顺序：

1. 新增四个 `agent-skills/**/SKILL.md`。
2. 新增 `src/lib/agent-skill-contracts/schema.ts` 和导出文件。
3. 运行 lint/build 验证类型和项目可构建。
4. 后续 change 再接入 Prompt Builder、Realtime session 和 UI。

回滚策略：删除新增 `agent-skills/` 和 `src/lib/agent-skill-contracts/` 文件即可，不影响现有应用运行。

## Open Questions

- 后续 Prompt Builder 是否每次加载完整 Skill，还是按任务选择最小 Skill 子集。
- 后续 Assessment Agent 使用 OpenAI Responses API 直接调用，还是在更复杂评测链路中引入 LangGraph。V1 当前倾向直接调用官方 API。
