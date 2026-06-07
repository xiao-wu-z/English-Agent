## Context

English-Agent 的产品主链路是一场英语口语练习：用户选择场景，进入多轮对话，系统在过程中做轻量候选纠错，结束后完成评测、纠错汇总和总结。前面的 changes 已经分别定义了场景、技能合同、可执行 Skill Runtime、Provider 抽象和 file-based badcase log，但还没有把这些能力串成一个 session-level flow。

`ai-tuoke-mt-agent` 的长上下文处理方式值得借鉴：它不把完整历史直接塞进 prompt，而是用压缩摘要、最近消息和当前输入组成运行态上下文。English-Agent V1 不需要它的 Redis、数据库、向量检索或后台任务，但应借鉴这种 full history 与 runtime context 分离的架构。

## Goals / Non-Goals

**Goals:**

- 定义一次 practice session 的状态机。
- 支持用户取消会话，明确 `abandoned` 与 `failed` 的区别。
- 定义 turn schema，承载用户文本、AI 文本、目标归因、候选纠错和 turn-level 评测。
- 定义完整 transcript 的保存结构。
- 定义 `RollingSummary` 和 `ConversationMemorySnapshot`。
- 定义长对话压缩触发规则。
- 定义 `buildConversationMemorySnapshot` 的行为边界。
- 定义本地 session repository 接口。
- 定义 session events，给后续 skill runtime 和 badcase log 接入。

**Non-Goals:**

- 不实现 UI。
- 不接通义、OpenAI 或其他模型。
- 不实现 Realtime / WebRTC / WebSocket 语音链路。
- 不真正调用模型生成 rolling summary。
- 不实现跨 session 长期记忆。
- 不实现向量数据库、SQLite、Redis、MySQL 或服务端数据库。
- 不实现自动 badcase judge。
- 不实现完整 Agent Skill Runtime。

## Decisions

### Decision 1: Session 状态显式区分 completed、abandoned 和 failed

状态集合：

```text
created
active
ending
completed
abandoned
failed
```

状态转换：

```text
created -> active
created -> abandoned
active -> ending
active -> abandoned
active -> failed
ending -> completed
ending -> failed
```

`completed` 表示用户正常结束并完成课后 summary。`abandoned` 表示用户取消、关闭页面或主动放弃，不保证有 summary。`failed` 表示系统错误，例如 provider 失败、schema validation 失败或 storage 失败。

### Decision 2: 完整历史和模型上下文分离

完整 turns 保存在 session 中，用于本地历史、课后展示、问题追溯和 badcase 证据。模型运行时不直接消费完整 turns，而是消费：

```text
rollingSummary + recentTurns + currentUserInput
```

这避免长对话持续膨胀 prompt，也让后续 Prompt Builder 的 Tier 3 更稳定。

### Decision 3: RollingSummary 使用结构化对象

不把长对话摘要设计成单个字符串，而是结构化：

```ts
{
  coveredGoals: string[];
  unresolvedIssues: string[];
  learnerPatterns: string[];
  conversationFacts: string[];
  correctionFocus: string[];
  lastUpdatedTurnId: string;
  updatedAt: string;
}
```

结构化摘要更容易被 practice、assessment、summary 和 badcase hints 消费，也方便后续测试。

### Decision 4: V1 只定义压缩触发，不调用模型压缩

本 change 定义：

```ts
shouldCompressConversation(session) =
  session.turns.length > 8 ||
  estimatedChars(session.turns) > 12000
```

但不实现模型摘要生成。后续可单独开 `add-conversation-memory-compression`，由 summary skill、memory skill 或 provider adapter 生成新的 `RollingSummary`。

### Decision 5: Repository 先定义接口，默认本地历史

V1 Demo 主要是本地历史，不引入数据库。业务层应依赖 `PracticeSessionRepository` 接口，而不是直接依赖 `localStorage`。默认实现后续可以用 `localStorage`；如果文字数据增长或浏览器限制明显，再迁移到 IndexedDB。

接口边界：

```ts
saveSession(session)
getSession(sessionId)
listSessions()
updateSession(session)
deleteSession(sessionId)
```

### Decision 6: 事件 Hook 只定义类型，不实现事件总线

本 change 定义 session events：

```text
session.started
turn.completed
correction.dismissed
session.ending
summary.completed
session.abandoned
session.failed
provider.schema_failed
```

后续 badcase log 可以监听 `correction.dismissed` 和 `provider.schema_failed`。Skill Runtime 可以监听 `turn.completed`、`session.ending` 和 `summary.completed`。本 change 不实现事件总线。

## Proposed Modules

- `src/lib/practice-session/schema.ts`
  - session status、turn、rolling summary、memory snapshot、event schema、repository 类型。
- `src/lib/practice-session/state.ts`
  - allowed transition 定义、`assertSessionTransition`、`canTransitionSession`。
- `src/lib/practice-session/memory.ts`
  - `estimateConversationChars`
  - `shouldCompressConversation`
  - `buildConversationMemorySnapshot`
- `src/lib/practice-session/repository.ts`
  - `PracticeSessionRepository` 接口。
- `src/lib/practice-session/index.ts`
  - public exports。
- `src/lib/practice-session/*.test.ts`
  - schema、state、memory 行为测试。

## Data Flow

```text
Scenario selected
        ↓
PracticeSession(status=created)
        ↓
session.started -> active
        ↓
turn.completed events append PracticeTurn[]
        ↓
buildConversationMemorySnapshot
        ↓
future Prompt Runtime Tier 3
        ↓
session.ending
        ↓
future assessment/correction/summary skills
        ↓
summary.completed -> completed
```

取消链路：

```text
created/active
        ↓
session.abandoned
        ↓
PracticeSession(status=abandoned)
```

失败链路：

```text
active/ending
        ↓
session.failed
        ↓
PracticeSession(status=failed)
```

## Prompt Placement

Practice session memory belongs to Tier 3:

```text
Tier 1: Core Coach Rules
Tier 2: Scenario + Active Skill
Tier 3: Runtime State + ConversationMemorySnapshot + Relevant Badcase Hints
```

完整 transcript 不进入 Tier 1 或 Tier 2。`ConversationMemorySnapshot` 是未来 Prompt Builder 消费的 runtime state。

## Error Handling

- 非法状态转换应抛出包含 from/to 状态的清晰错误。
- 缺少 required session 或 turn 字段时，schema validation 失败。
- `completed` session 必须包含 final summary 引用或 summary payload。
- `abandoned` session 不要求 final summary。
- `failed` session 必须包含 failure reason。
- `buildConversationMemorySnapshot` 应按最近 N 轮截断，不改变原始 session。
- repository 失败应通过调用层转成 `session.failed`，本 change 只定义错误归因字段。

## Risks / Trade-offs

- [Risk] 把 memory 和 session flow 放在一个 change 可能偏大 → Mitigation: 只定义 schema、状态机和 snapshot helper，不实现模型压缩和 UI。
- [Risk] localStorage 容量有限 → Mitigation: repository 接口先稳定，默认实现后续可替换为 IndexedDB。
- [Risk] RollingSummary 未真正生成时长对话仍可能变长 → Mitigation: MVP 先保留触发规则和 snapshot 边界，后续单独实现 compression。
- [Risk] session events 先只有类型没有总线 → Mitigation: 当前目标是合同稳定，事件总线在 realtime/session orchestration change 中实现。

## Migration Plan

No migration is required.

Implementation order:

1. Define schemas and types.
2. Implement state transition helpers.
3. Implement memory snapshot helpers.
4. Define repository interface.
5. Add tests for schema, transitions and memory behavior.

## Open Questions

- 后续 rolling summary 是由 summary skill 复用生成，还是新增 memory compression skill。当前倾向后续单独 change 决定。
- 默认本地存储应先用 `localStorage` 还是 IndexedDB。当前 change 只定义 repository 接口。
