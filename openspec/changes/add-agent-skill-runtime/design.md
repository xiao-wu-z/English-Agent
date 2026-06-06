## Context

English-Agent 已经有 `agent-skills/**/SKILL.md` 作为 Agent 行为合同，并且 `add-scenario-catalog` 会提供 `ScenarioPromptContext`。下一步需要一个运行时外壳，把 Skill 从静态文档升级成可运行的执行单元，但暂时不做模型调用。

这个设计参考 `ai-tuoke-mt-agent` 的两点：第一，Prompt 分层，T1 核心规则常驻、T2 按需注入、T3 放运行态；第二，Skill 不一次性全量注入，而是通过 registry/loader/runner 按当前任务加载单个 Skill。我们保留这种架构优势，但不引入它的重型后端设施。

## Goals / Non-Goals

**Goals:**

- 定义 Agent Skill Runtime：registry、loader、runner、handler shell。
- 建立三层 Prompt Context Builder：
  - T1：Core Coach Rules。
  - T2：Scenario Prompt Context + Active Single Skill。
  - T3：Runtime State。
- 输出 provider-neutral `SkillRunRequest`。
- 按 task 只加载一个 `SKILL.md`，不全量注入四个 Skill。
- 复用已有 Agent Skill 输出 schema，绑定 expected output schema。
- 为后续通义/OpenAI/mock provider adapter 提供稳定输入。

**Non-Goals:**

- 不调用通义、OpenAI、DashScope 或任何模型。
- 不实现 WebRTC、WebSocket 或 Realtime 语音链路。
- 不实现 UI。
- 不实现 badcase log。
- 不实现 skill router。
- 不实现自动扫描、数据库热加载或多 variant Skill。

## Decisions

### Decision 1: Runtime 只生成 `SkillRunRequest`

本 change 的输出是 provider-neutral request：

```ts
type SkillRunRequest = {
  task: "practice" | "assessment" | "correction" | "summary";
  skillId: string;
  providerMode: "realtime" | "text";
  messages: PromptMessage[];
  expectedOutputSchema: ExpectedOutputSchemaName;
};
```

后续 provider adapter 再负责把 request 转成通义、OpenAI 或 mock 调用。这样可以先验证 Prompt 结构和 Skill 选择，不把模型差异引入 runtime。

### Decision 2: T1 用代码常量，不单独建 Skill 文档

T1 是短而硬的全局规则，先放在代码常量 `CORE_COACH_RULES`：

- 你是英语口语陪练 Agent。
- 目标是让学习者多开口、自然练习、得到可执行反馈。
- 不冒充官方考试评分。
- 不暴露 chain-of-thought。
- 不编造场景事实或用户说过的话。
- 不把低置信内容当确定反馈。
- 不用长篇教学打断口语练习。
- 不在前端暴露 API key 或 provider secret。
- Scenario 负责练什么，Skill 负责怎么执行，Provider Adapter 负责模型供应商。

替代方案是新增 `agent-skills/core-coach-rules/SKILL.md`。当前 T1 内容稳定且短，代码常量更简单；后续膨胀时再外置。

### Decision 3: T2 只加载 active single skill

Practice 任务只加载 `english-practice`，Summary 任务只加载 `english-summary`。这吸收了渐进式披露思路，避免每次把四个 Skill 文档全塞进 prompt。

后续可以增加 skill catalog summary 或 skill router，但本 change 使用静态 task → skill binding。

### Decision 4: Loader 必须 server-only

`SKILL.md` 读取需要 `fs/promises`，不能进入前端 bundle。实现时应把文件读取逻辑放到 `src/lib/agent-skills/loader.server.ts`，并只在 server-side API 或测试中使用。

### Decision 5: Handler shell 只声明元数据和任务指令

每个 Skill handler shell 包含：

- `task`
- `skillId`
- `providerMode`
- `expectedOutputSchema`
- `buildInstruction(input)`

它不直接调用模型，不做复杂业务逻辑。这样每个 Skill 已经是独立执行单元的外壳，后续只需接 provider adapter。

## Proposed Modules

- `src/lib/agent-skills/types.ts`
  - `AgentSkillTask`
  - `PromptMessage`
  - `RuntimePromptState`
  - `SkillRunRequest`
  - `AgentSkillHandler`
- `src/lib/agent-skills/core-rules.ts`
  - `CORE_COACH_RULES`
- `src/lib/agent-skills/handlers.ts`
  - 四个 handler shell。
- `src/lib/agent-skills/registry.ts`
  - 静态 registry 和 lookup。
- `src/lib/agent-skills/loader.server.ts`
  - 读取单个 `SKILL.md`。
- `src/lib/agent-skills/prompt-context.ts`
  - 构建 T1/T2/T3 messages。
- `src/lib/agent-skills/runner.server.ts`
  - `runAgentSkill(input)`。
- `src/lib/agent-skills/index.ts`
  - 导出非 fs 类型和 registry；server-only 文件按需单独导入。

## Data Flow

```text
task + scenario + runtimeState
        ↓
resolve skill id from scenario.skillBindings
        ↓
registry resolves handler shell
        ↓
loader.server reads active SKILL.md
        ↓
prompt-context builds T1 + T2 + T3 messages
        ↓
runner.server returns SkillRunRequest
        ↓
future provider adapter executes request
```

## Error Handling

- 未知 task：抛出明确错误。
- scenario 未绑定对应 task：抛出明确错误。
- registry 找不到 skill id：抛出明确错误。
- handler task 与 requested task 不匹配：抛出明确错误。
- `SKILL.md` 文件缺失：抛出包含 skill id 和路径的错误。
- runtime state 不符合 schema：schema parse 失败，不生成 request。

## Verification

测试应覆盖：

- practice task 只加载 `english-practice`。
- summary task 只加载 `english-summary`。
- messages 包含 T1/T2/T3。
- messages 不包含非 active Skill 文档。
- unknown skill 报错。
- providerMode 和 expectedOutputSchema 正确。
- request 不包含 provider endpoint、API key 或模型名。

## Risks / Trade-offs

- [Risk] 先做 runtime 但 scenario catalog 未实现会导致实现依赖不完整 → Mitigation: OpenSpec 明确依赖 `add-scenario-catalog`，实际实现顺序先完成 scenario catalog。
- [Risk] Markdown 读取进入前端 bundle → Mitigation: loader 和 runner 使用 `.server.ts` 命名并限制导入路径。
- [Risk] T1 规则以后变长 → Mitigation: 先常量化，后续可单独 change 外置为 Core Skill。
- [Risk] 静态 registry 后续不够灵活 → Mitigation: V1 用静态 registry，后续再加 discovery/router/variant。

## Migration Plan

这是新增 runtime 外壳，不需要迁移。

建议实现顺序：

1. 先完成 `add-scenario-catalog` 实现。
2. 创建 runtime 类型和 runtime state schema。
3. 创建 core coach rules。
4. 创建四个 handler shell。
5. 创建 registry 和 loader。
6. 创建 prompt context builder 和 runner。
7. 添加测试并运行 `npm test`、`npm run lint`、`npm run build`。

## Open Questions

- 后续 provider adapter 是否先做 Qwen text/mock，还是直接做 Qwen realtime。当前建议先 text/mock，降低集成风险。
- 后续是否需要 skill router。V1 可以先由 scenario binding 和 task 显式选择。
