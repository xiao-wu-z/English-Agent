## Context

English-Agent 的关键体验是“像真人陪练一样对话，同时给出可信反馈”。如果 practice、correction、assessment、summary 都直接由单次模型调用决定，系统很容易把低置信输出展示给用户。用户之前明确要求引入 ReAct 架构和置信度/质量评估，降低幻觉概率。

本 change 定义的是 bounded ReAct orchestration：它保留 observe、act、assess、decide 的结构化闭环，但限制最大步数和重试次数，避免无限循环或复杂 planner。它借鉴 `ai-tuoke-mt-agent` 中“工具/skill 执行后要被评估和路由”的思路，但不引入 swarm、多 Agent 后端或自动 judge 重设施。

## Goals / Non-Goals

**Goals:**

- 定义 `ReActRun`、`ReActStep`、`ReActDecision` 和 `ReActLoopPolicy`。
- 默认限制最大步数为 5。
- 默认限制每步重试为 1。
- 默认限制 provider failure 上限为 2。
- 定义 observe、act、assess、decide、final step 类型。
- 定义质量闸门，复用 `confidenceLabel`、`riskLevel`、`QualityAssessment`。
- 定义停止条件和安全降级动作。
- 定义 badcase signal 触发点。
- 保证不记录、不展示 chain-of-thought。

**Non-Goals:**

- 不调用通义、OpenAI、mock provider 或任何真实模型。
- 不实现完整 Agent Skill Runtime。
- 不实现 Prompt Context Builder。
- 不实现 UI。
- 不实现 realtime voice。
- 不实现多 Agent swarm。
- 不实现无限 planner。
- 不实现自动 badcase judge。

## Decisions

### Decision 1: 使用 bounded ReAct，而不是开放式 ReAct

MVP 默认 loop policy：

```ts
{
  maxSteps: 5,
  maxRetriesPerStep: 1,
  maxProviderFailures: 2,
  stopOnHighRisk: true,
  stopOnSchemaValidationFailureAfterRetry: true
}
```

默认链路：

```text
observe -> act -> assess -> decide -> final
```

达到最大步数必须停止。不能继续追加 step，也不能让模型自行决定无限循环。

### Decision 2: Step 记录结构化摘要，不记录隐藏推理

`ReActStep` 应记录：

```ts
{
  id;
  runId;
  index;
  type;
  skillId;
  status;
  inputSummary;
  outputSummary;
  confidenceLabel?;
  riskLevel?;
  startedAt;
  endedAt?;
}
```

`inputSummary` 和 `outputSummary` 是可审计摘要，不是 chain-of-thought。step 中不得包含 `thought`、`chainOfThought`、`reasoningTrace` 等隐藏推理字段。

### Decision 3: Quality gate 在 decide 前执行

模型或 Skill 的输出不能直接展示。它应先经过 assessment/quality gate，得到：

- `confidenceLabel`
- `riskLevel`
- `roleAlignment`
- `scenarioRelevance`
- `pedagogicalValue`
- `hallucinationRisk`
- `recommendedAction`
- evidence / reasons

质量闸门失败时，不应展示给用户；应 suppress、defer、retry 或 log badcase。

### Decision 4: Decision action 必须有限集合

`ReActDecision.action`：

```text
show
suppress
retry
defer_to_summary
ask_clarifying_question
log_badcase
final
```

`reasonCode`：

```text
high_confidence
low_confidence
schema_validation_failed
high_hallucination_risk
provider_failed
max_steps_reached
session_not_active
user_abandoned
policy_stop
```

如果达到 `maxSteps` 仍未得到稳定输出，decision 应使用 `max_steps_reached`，并走 suppress、defer_to_summary、log_badcase 或 final 的安全路径。

### Decision 5: Retry 只用于有限场景

允许 retry 的主要场景：

- provider 输出 JSON 无法解析。
- provider 输出不符合 expected schema。
- provider 短暂失败且未超过 `maxProviderFailures`。

低置信并不默认 retry。对英语学习反馈来说，低置信更适合 suppress 或 defer_to_summary。高幻觉风险必须停止展示并可触发 badcase。

### Decision 6: Badcase 触发点在 orchestration 层定义

以下情况应能触发 badcase signal：

- provider schema failure。
- retry 后仍失败。
- high hallucination risk。
- high risk correction 被 suppress。
- 用户 dismiss correction。
- 用户 regenerate summary。
- max steps reached without safe final output。

本 change 只定义触发点和 attribution，不实现 file append。

## Proposed Modules

- `src/lib/react-orchestration/schema.ts`
  - `reactStepTypeSchema`
  - `reactStepStatusSchema`
  - `reactDecisionSchema`
  - `reactLoopPolicySchema`
  - `reactStepSchema`
  - `reactRunSchema`
  - TypeScript types
- `src/lib/react-orchestration/policy.ts`
  - default policy
  - `canContinueReactRun`
  - `shouldStopReactRun`
  - retry/failure limit helpers
- `src/lib/react-orchestration/decision.ts`
  - `decideFromQualityGate`
  - safety downgrade mapping
- `src/lib/react-orchestration/index.ts`
  - public exports
- `src/lib/react-orchestration/*.test.ts`
  - schema、policy、decision tests

## Data Flow

```text
Practice session runtime state
        ↓
observe step
        ↓
prompt context + active skill
        ↓
act step
        ↓
quality assessment
        ↓
assess step
        ↓
decision
        ↓
show / suppress / retry / defer / log_badcase / final
```

## Error Handling

- `maxSteps <= 0`：policy validation 失败。
- `maxRetriesPerStep < 0`：policy validation 失败。
- `maxProviderFailures < 0`：policy validation 失败。
- step index 超过 `maxSteps`：run 必须停止。
- retry 次数超过 policy：decision 不得继续 retry。
- provider failure 超过 policy：decision 必须停止或安全降级。
- session status 为 `abandoned` 或 `failed`：run 必须停止。
- step 出现 hidden reasoning 字段：schema validation 失败。

## Prompt And Privacy Safety

ReAct orchestration 不得暴露 chain-of-thought。允许记录的是：

- step type
- status
- input summary
- output summary
- confidence/risk labels
- decision action
- reason code
- evidence/reasons from quality contract

不允许记录或输出：

- hidden chain-of-thought
- raw internal reasoning trace
- provider API key
- provider authorization header
- full secret config

## Risks / Trade-offs

- [Risk] ReAct 增加延迟 → Mitigation: MVP bounded policy 最大 5 步，并不是开放式循环。
- [Risk] 质量闸门过严导致反馈被压制 → Mitigation: 低置信输出可 defer_to_summary，不直接丢弃全部学习价值。
- [Risk] retry 滥用导致 demo 卡顿 → Mitigation: 每步最多 1 次 retry，provider failure 最多 2 次。
- [Risk] step summary 被误当 chain-of-thought → Mitigation: schema 禁止 hidden reasoning 字段，只存摘要和决策原因码。

## Migration Plan

No migration is required.

Implementation order:

1. Define schemas and types.
2. Implement default loop policy and stop helpers.
3. Implement decision helper based on quality gate and policy.
4. Add tests for bounded loop, retry limits, stop conditions, hidden reasoning rejection and badcase trigger mapping.

## Open Questions

- ReAct run 是否要和 practice session event 共用事件总线。当前建议只共享 attribution 字段，事件总线后续再定。
- `reasonCode` 是否需要进一步细分 correction/assessment/summary 场景。当前 V1 保持通用。
