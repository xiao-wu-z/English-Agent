## Context

English-Agent 需要尽快得到一条可演示的练习闭环。前面的 OpenSpec changes 把底层能力拆得比较清楚，但真正 Demo 前还需要定义：Next 前端如何触发练习、API 如何推进 session、每轮如何得到 AI 文本回复、轻纠错如何展示、结束时如何总结和保存。

本 change 采用文本优先策略。文本链路能验证场景、session、skill runtime、prompt builder、provider abstraction、bounded ReAct、本地历史这些核心模块。语音和多模态 realtime 后续单独实现，避免把 Demo 第一版复杂化。

## Goals / Non-Goals

**Goals:**

- 定义 Next.js 文本版 practice demo flow。
- 定义最小可用页面结构。
- 定义 Route Handler API 合同。
- 定义每轮 turn orchestration。
- 定义 session end orchestration。
- 默认使用 mock provider，让 Demo 不依赖外部 key。
- 定义错误处理和安全降级。
- 定义本地历史保存位置。

**Non-Goals:**

- 不接麦克风。
- 不实现 ASR。
- 不实现 TTS。
- 不实现 Realtime WebRTC / WebSocket。
- 不实现 Qwen realtime voice provider。
- 不实现完整历史管理页面。
- 不做登录、云同步或服务端数据库。
- 不实现复杂 UI 动画。
- 不做移动端深度优化。
- 不把真实 API key 写入仓库。

## Decisions

### Decision 1: 文本 Demo 先用 Next Route Handlers

API 边界：

```text
POST /api/practice-sessions
POST /api/practice-sessions/:id/turns
POST /api/practice-sessions/:id/end
GET  /api/practice-sessions/:id
```

Route Handler 是 Next.js App Router 的自然边界。后续接模型 provider、server-only skill loader 和 session orchestration 都可以在服务端完成，避免 client component 直接接触 provider secrets。

### Decision 2: 默认 provider 仍是 mock

文本 Demo 默认 `MODEL_PROVIDER=mock`，不要求 `DASHSCOPE_API_KEY` 或 `QWEN_API_KEY`。这样本地、CI 和演示环境都能稳定跑通。

Qwen realtime 多模态模型后续独立 change：

```text
add-qwen-realtime-voice-provider
```

推荐后续配置名：

```text
QWEN_REALTIME_MODEL=qwen3.5-omni-plus-realtime
DASHSCOPE_API_KEY=<server-only local env>
```

本 change 不读取、不保存、不提交真实 API key。

### Decision 3: 每轮 turn 使用 bounded orchestration

每轮流程：

```text
validate session active
        ↓
build conversation memory snapshot
        ↓
run practice skill for AI reply
        ↓
run correction candidate
        ↓
quality gate / bounded ReAct decision
        ↓
append turn
        ↓
return AI reply + optional after-turn correction
```

如果 correction 低置信或 high risk，返回 decision 为 suppress 或 defer_to_summary，不直接展示。

### Decision 4: 结束 session 生成总结并保存历史

结束流程：

```text
validate session active
        ↓
transition active -> ending
        ↓
run final assessment
        ↓
aggregate corrections
        ↓
run summary skill
        ↓
transition ending -> completed
        ↓
save local practice history
        ↓
return summary
```

summary failed 时不得把 session 标为 completed。应返回明确错误或安全降级状态。

### Decision 5: 页面只做最小 Demo 体验

页面范围：

- 场景选择。
- 当前 session 状态。
- 对话消息区。
- 文本输入框。
- 每轮轻纠错展示区。
- 结束练习按钮。
- 总结结果区。
- 本地历史入口预留。

不做完整历史页、不做复杂设计系统、不做语音控件。

### Decision 6: API 返回结构化结果

创建 session 返回：

```ts
{
  session;
  scenario;
}
```

提交 turn 返回：

```ts
{
  session;
  turn;
  aiReply;
  correctionDecision?;
  realtimeCorrection?;
}
```

结束 session 返回：

```ts
{
  session;
  summary;
  savedToHistory: boolean;
}
```

### Decision 7: 依赖底层 changes，但不重复内部实现

本 change 消费以下能力：

- `add-scenario-catalog`
- `add-practice-session-flow`
- `add-agent-skill-runtime`
- `add-prompt-context-builder`
- `add-model-provider-abstraction`
- `add-react-skill-orchestration`
- `add-local-practice-history`

实现顺序上应先完成这些基础模块，再实现文本 Demo flow。Spec 只定义 orchestration 和 API/UI 合同，不重复定义底层 schema。

## Proposed Modules

- `src/app/page.tsx`
  - 最小文本练习 Demo 页面。
- `src/app/api/practice-sessions/route.ts`
  - create session。
- `src/app/api/practice-sessions/[sessionId]/route.ts`
  - get session。
- `src/app/api/practice-sessions/[sessionId]/turns/route.ts`
  - submit text turn。
- `src/app/api/practice-sessions/[sessionId]/end/route.ts`
  - end session and summarize。
- `src/lib/text-practice-flow/types.ts`
  - API request/response schema。
- `src/lib/text-practice-flow/orchestrator.server.ts`
  - server-side orchestration, no client import。
- `src/lib/text-practice-flow/index.ts`
  - safe exports。

## Data Flow

```text
Next page
        ↓
POST /api/practice-sessions
        ↓
scenario catalog + practice session created
        ↓
POST /api/practice-sessions/:id/turns
        ↓
memory snapshot + skill runtime + prompt builder + mock provider + ReAct decision
        ↓
AI reply + optional correction
        ↓
POST /api/practice-sessions/:id/end
        ↓
assessment + summary + local history
```

## Error Handling

- Unknown scenario id: return clear 400 error.
- Missing session: return 404.
- Session not active when submitting turn: return 409.
- Empty user text: return 400.
- Provider schema failure: return structured error and do not append unsafe output.
- ReAct max steps reached: suppress unsafe output or defer to summary.
- Summary failed: do not mark session completed.
- Local history save failed: return summary plus `savedToHistory: false` and safe error code.

## Secret Safety

- No API key in OpenSpec artifacts.
- No API key in source code.
- No API key in client bundle.
- No API key in local practice history.
- No API key in prompt messages.
- No API key in commit messages.
- `.env.local` is the only acceptable local place for real credentials, and `.gitignore` must ignore `.env*`.

## Risks / Trade-offs

- [Risk] Text flow may not reveal voice-specific issues → Mitigation: this is intentional; voice is a later provider/transport change.
- [Risk] Mock provider can hide real Qwen behavior → Mitigation: Qwen text/realtime integration gets separate changes and tests.
- [Risk] API route state management is tricky without database → Mitigation: V1 can use local/session repository boundary; exact implementation follows `local-practice-history`.
- [Risk] Change depends on many previous capabilities → Mitigation: this is an orchestration change; implementation should happen after foundational modules.

## Migration Plan

No migration is required.

Implementation order:

1. Implement foundational changes in dependency order.
2. Define text practice API request/response schemas.
3. Implement server-side orchestrator with mock provider.
4. Implement Route Handlers.
5. Implement minimal Next page.
6. Add tests for API contracts and orchestration errors.

## Open Questions

- Whether in-memory server state is acceptable for early Route Handler testing before local history implementation is complete. Current recommendation: avoid long-lived server memory in final implementation.
- Whether history list page should be a follow-up change. Current recommendation: keep this change to one Demo page and reserve full history UI for later.
