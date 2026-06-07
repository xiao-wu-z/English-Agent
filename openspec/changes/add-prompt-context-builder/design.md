## Context

English-Agent 的稳定性依赖三层 Prompt 架构：

```text
Tier 1: Core Coach Rules
Tier 2: ScenarioPromptContext + Active Skill Instruction
Tier 3: ConversationMemorySnapshot + Relevant Badcase Hints + Current Task Input
```

前面的 changes 已经分别定义了这些输入来源，但还没有单独规定如何把它们组合成最终模型消息。`ai-tuoke-mt-agent` 的经验是：不要在主模型 prompt 中全量塞入所有 skill、完整历史和无关上下文，而是按层级、按任务、按运行态选择性注入。English-Agent 应保留这个思想，同时保持 V1 实现轻量。

## Goals / Non-Goals

**Goals:**

- 定义三层 prompt 的结构化 bundle。
- 定义 provider-neutral messages。
- 把 T1、T2、T3 输入组合成单次 skill/model request 可消费的上下文。
- 保证 T1 优先级最高，T2/T3 不能覆盖 T1。
- 保证 T2 只包含当前 scenario 和 active single skill。
- 保证 T3 只包含 runtime memory、badcase hints 和 current task input。
- 限制 recent turns 和 badcase hints，避免 prompt 膨胀。
- 输出 metadata，便于后续调试。
- 绑定 expected output schema name，但不执行 schema validation。

**Non-Goals:**

- 不调用模型。
- 不实现 Qwen、OpenAI 或 mock provider。
- 不实现 ReAct loop。
- 不实现 realtime voice。
- 不实现 UI。
- 不读取完整 session repository。
- 不实现 badcase judge。
- 不实现 skill router。
- 不把所有 Agent Skills 全量注入 prompt。

## Decisions

### Decision 1: 先构建结构化 Bundle，再渲染 Messages

Builder 应先输出结构化 `PromptContextBundle`，再由 `renderPromptMessages` 渲染为 provider-neutral messages。这样测试可以分别验证层级内容和最终 messages。

```ts
type PromptContextBundle = {
  tier1: CorePromptContext;
  tier2: SkillScenarioPromptContext;
  tier3: RuntimePromptContext;
  expectedOutputSchemaName: string;
  metadata: PromptContextMetadata;
};
```

替代方案是直接拼 `messages[]`。直接拼接更快，但更难测试“某条内容属于哪一层”，也更难防止 badcase hints 或 scenario 覆盖 core rules。

### Decision 2: PromptMessage provider-neutral

`PromptMessage` 只表达 role 和 content：

```ts
type PromptMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
```

它不包含 provider name、model name、endpoint、API key、transport、temperature 或 max tokens。这些属于 provider adapter。

### Decision 3: T1 不允许被覆盖

T1 包含 Core Coach Rules，例如：

- 英语口语陪练身份。
- 不冒充官方考试评分。
- 不暴露 chain-of-thought。
- 不编造用户没有说过的事实。
- 不把低置信内容当确定反馈。
- 不用长篇教学打断口语练习。
- 不在 prompt 中包含 provider/API key/transport 细节。

T2/T3 可以补充当前任务细节，但不能删除、改写或弱化 T1。

### Decision 4: T2 只包含 Scenario + Active Skill

T2 输入包括：

- `ScenarioPromptContext`
- active skill id
- active skill instruction
- expected output schema name

Practice task 只注入 `english-practice`；Summary task 只注入 `english-summary`。不全量注入四个 skill markdown。

### Decision 5: T3 使用 memory snapshot，不使用完整 transcript

T3 输入包括：

- `ConversationMemorySnapshot`
- relevant `BadcaseHint[]`
- current task input

完整 transcript 不进入 prompt builder。Builder 只接收由 practice session flow 产生的 snapshot。recent turns 默认限制为 6，badcase hints 默认限制为 3。

### Decision 6: Builder 负责 budget 截断，但不做语义压缩

Builder 可以按数量和字符预算裁剪：

- recent turns：默认最多 6 轮。
- badcase hints：默认最多 3 条。
- estimated chars：输出到 metadata。

Builder 不调用模型做摘要。如果上下文超过预算，只能裁剪 recent turns 和 hints；真正的长对话压缩由后续 conversation memory compression change 负责。

### Decision 7: Metadata 是一等输出

`PromptContextMetadata` 应包含：

```ts
{
  scenarioId;
  scenarioVersion;
  skillId;
  includedTiers;
  recentTurnCount;
  badcaseHintCount;
  estimatedChars;
  expectedOutputSchemaName;
}
```

这能帮助定位 prompt 污染、上下文过长和 skill/schema 绑定错误。

## Proposed Modules

- `src/lib/prompt-context/types.ts`
  - `PromptMessage`
  - `PromptContextBundle`
  - `PromptContextMetadata`
  - builder input/options types。
- `src/lib/prompt-context/builder.ts`
  - `buildPromptContextBundle`
  - budget、limit 和 provider-neutral validation。
- `src/lib/prompt-context/render.ts`
  - `renderPromptMessages`
  - 分层渲染成 messages。
- `src/lib/prompt-context/index.ts`
  - public exports。
- `src/lib/prompt-context/*.test.ts`
  - bundle、render、budget、safety tests。

## Data Flow

```text
Core Coach Rules
ScenarioPromptContext
Active Skill Instruction
ConversationMemorySnapshot
BadcaseHint[]
Current Task Input
Expected Output Schema Name
        ↓
buildPromptContextBundle
        ↓
PromptContextBundle + metadata
        ↓
renderPromptMessages
        ↓
PromptMessage[]
        ↓
future SkillRunRequest / Model Provider
```

## Prompt Rendering

Recommended rendering shape:

```text
system:
  [Tier 1] Core Coach Rules

system:
  [Tier 2] Scenario Context
  [Tier 2] Active Skill Instruction
  [Tier 2] Expected Output Schema Name

user:
  [Tier 3] Conversation Memory Snapshot
  [Tier 3] Relevant Badcase Hints
  [Tier 3] Current Task Input
```

The exact formatting can be Markdown-like text, but output must stay provider-neutral and deterministic.

## Error Handling

- Missing T1 rules: fail before rendering.
- Missing scenario id or version: fail before rendering.
- Missing active skill id or instruction: fail before rendering.
- Missing expected output schema name: fail before rendering.
- Provider/model/API key/transport words in prompt inputs: fail provider-neutral validation.
- Negative or zero limits: fail option validation.
- Oversized badcase hints: truncate by count, not by mutating source data.

## Risks / Trade-offs

- [Risk] Overlaps with `add-agent-skill-runtime` prompt-context module → Mitigation: this change owns generic prompt bundle/render contracts; skill runtime consumes it rather than hand-rolling messages.
- [Risk] Prompt builder becomes too smart → Mitigation: no model calls, no semantic compression, no skill routing, no provider execution.
- [Risk] Metadata leaks sensitive content → Mitigation: metadata only includes ids, counts and estimates, not transcript text or API secrets.
- [Risk] Naive character estimate differs from tokens → Mitigation: V1 uses chars for deterministic tests; provider-specific token counting can be added later.

## Migration Plan

No migration is required.

Implementation order:

1. Define types.
2. Implement bundle builder with validation and limits.
3. Implement message renderer.
4. Add tests for tier separation, limits, metadata and provider-neutral safety.
5. Update future `agent-skill-runtime` implementation plan to consume prompt-context builder instead of duplicating prompt assembly.

## Open Questions

- Whether `ExpectedOutputSchemaName` should reuse the exact enum from Agent Skill Runtime or live in shared contracts. Current recommendation: reuse one shared enum once implementation begins.
- Whether provider-neutral banned words should share validation helper with Scenario Catalog. Current recommendation: extract only if duplication appears during implementation.
