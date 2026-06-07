## Context

Practice session flow 定义了 session、turn、rolling summary、final summary 和 repository 接口。MVP 还需要一个轻量、可测试的本地历史方案，让 Demo 用户可以看到之前完成或取消的练习，而不是每次刷新都丢失。

本地历史与 badcase log 的职责不同：local practice history 保存用户练习记录，面向回看和恢复；file-based badcase log 保存失败证据，面向质量改进和回归。两者不应混在同一个 storage key 或数据结构里。

## Goals / Non-Goals

**Goals:**

- 定义 localStorage 存储 key 和 version。
- 定义本地历史 storage schema。
- 定义 `PracticeSessionListItem`。
- 定义 localStorage repository 行为。
- 支持 save、get、list、update、delete。
- 定义容量和裁剪策略。
- 定义 storage error codes。
- 明确敏感内容和隐藏推理不得保存。

**Non-Goals:**

- 不实现 UI。
- 不做云同步。
- 不做用户登录。
- 不做服务端数据库。
- 不实现 IndexedDB。
- 不保存原始音频。
- 不做跨设备恢复。
- 不做向量记忆。
- 不写 badcase log。
- 不调用模型或 provider。

## Decisions

### Decision 1: V1 默认使用 localStorage

本地 Demo 场景下，localStorage 足以保存少量文字 session 历史。默认 storage key：

```text
english-agent.practice-sessions.v1
```

stored payload 包含：

```ts
{
  version: 1;
  sessions: PracticeSession[];
  updatedAt: string;
}
```

### Decision 2: 业务层仍依赖 repository 接口

实现可以叫 `LocalPracticeSessionRepository`，但调用方仍通过 `PracticeSessionRepository` 使用：

```ts
saveSession(session)
getSession(sessionId)
listSessions()
updateSession(session)
deleteSession(sessionId)
```

这样后续迁移 IndexedDB 或服务端存储时，practice session orchestration 和 UI 不需要知道底层变了。

### Decision 3: 列表页使用摘要对象

历史列表不应该每次暴露完整 turns。定义：

```ts
{
  id;
  scenarioId;
  scenarioVersion;
  scenarioTitleZh?;
  status;
  startedAt;
  endedAt?;
  turnCount;
  overallScore?;
  summaryPreview?;
  updatedAt;
}
```

`PracticeSessionListItem` 用于列表和概览。详情页再按 id 读取完整 session。

### Decision 4: 容量策略保持确定性

MVP 默认：

```text
maxSessions = 50
maxFailedSessions = 10
```

超过总数时，优先裁剪最旧的 `completed` / `abandoned` session。failed session 只保留最近 10 条，避免错误记录无限增长。active/ending session 不应被自动裁剪，除非存储已不可用且调用方选择放弃恢复。

### Decision 5: 禁止保存敏感数据和隐藏推理

本地历史可以保存 transcript text、summary、correction 和 assessment，但不得保存：

- 原始音频。
- API key。
- provider secret。
- Authorization header。
- provider raw secret config。
- hidden reasoning。
- chain-of-thought。
- reasoning trace。

如果输入 session 包含这些字段，repository 应在保存前 schema validation 失败或安全过滤。V1 推荐失败而不是静默过滤，避免开发期误以为敏感数据已正确处理。

### Decision 6: storage error 使用有限 code

错误 code：

```text
parse_failed
schema_validation_failed
quota_exceeded
storage_unavailable
```

repository 层不直接清空损坏数据。调用层可以决定是否提示用户、导出调试信息或清空历史。

## Proposed Modules

- `src/lib/practice-history/schema.ts`
  - storage payload schema
  - `PracticeSessionListItem`
  - storage error schema/types
- `src/lib/practice-history/local-storage.ts`
  - `LocalPracticeSessionRepository`
  - storage key constant
  - read/write helpers
  - prune helpers
- `src/lib/practice-history/index.ts`
  - public exports
- `src/lib/practice-history/*.test.ts`
  - storage schema、repository、prune 和 safety tests

## Data Flow

```text
PracticeSession
        ↓
LocalPracticeSessionRepository.save/update
        ↓
validate safe session payload
        ↓
load existing storage payload
        ↓
upsert session
        ↓
apply pruning policy
        ↓
localStorage["english-agent.practice-sessions.v1"]
```

列表：

```text
localStorage payload
        ↓
schema validation
        ↓
sessions[]
        ↓
PracticeSessionListItem[]
```

## Error Handling

- localStorage 不可用：抛 `storage_unavailable`。
- JSON parse 失败：抛 `parse_failed`。
- payload 或 session schema 不合法：抛 `schema_validation_failed`。
- 写入超过浏览器 quota：抛 `quota_exceeded`。
- 删除不存在 session：幂等成功。
- 读取不存在 session：返回 undefined。

## Risks / Trade-offs

- [Risk] localStorage 容量有限 → Mitigation: 不保存音频，限制 session 数量，后续可迁移 IndexedDB。
- [Risk] JSON parse 失败导致历史不可读 → Mitigation: repository 抛明确错误，不静默吞掉。
- [Risk] session 数据结构后续变化 → Mitigation: storage payload 带 `version: 1`，后续可添加 migration。
- [Risk] 敏感字段误存本地 → Mitigation: schema/safety validation 禁止 provider secrets 和 hidden reasoning 字段。

## Migration Plan

No migration is required for V1.

Future versions can add:

```ts
migratePracticeHistoryPayload(payload)
```

to convert old storage versions.

Implementation order:

1. Define storage schema and list item schema.
2. Define error types.
3. Implement localStorage repository.
4. Implement pruning policy.
5. Add safety validation for forbidden fields.
6. Add tests for repository behavior, pruning, errors and forbidden data.

## Open Questions

- 后续是否从 localStorage 迁移到 IndexedDB。当前 V1 不实现。
- 是否允许导出历史 JSON。当前 change 不实现。
