## 1. Practice Session Schema

- [ ] 1.1 创建 `src/lib/practice-session/schema.ts`，定义 session status、practice session、practice turn、rolling summary、conversation memory snapshot、session event 的 Zod schema 和 TypeScript 类型。
- [ ] 1.2 在 schema 中校验 `completed` session 必须有 final summary，`abandoned` session 不要求 final summary，`failed` session 必须有 failure reason。
- [ ] 1.3 对齐已有 Agent Skill Contracts，使 turn 可承载 candidate issues、turn assessment 和 realtime correction。

## 2. Session State Machine

- [ ] 2.1 创建 `src/lib/practice-session/state.ts`，定义允许的状态转换表。
- [ ] 2.2 实现 `canTransitionSession(from, to)`。
- [ ] 2.3 实现 `assertSessionTransition(from, to)`，非法转换时报包含 from/to 的清晰错误。

## 3. Conversation Memory

- [ ] 3.1 创建 `src/lib/practice-session/memory.ts`，实现 `estimateConversationChars(session)`。
- [ ] 3.2 实现 `shouldCompressConversation(session)`，当 turns 超过 8 或 transcript 估算字符数超过 12000 时返回 true。
- [ ] 3.3 实现 `buildConversationMemorySnapshot(session, options)`，输出 optional rolling summary、最近 N 轮和 optional current user input。
- [ ] 3.4 确认 snapshot 构建不会 mutate 原始 session turns。

## 4. Repository Interface And Events

- [ ] 4.1 创建 `src/lib/practice-session/repository.ts`，定义 `PracticeSessionRepository` 接口，包含 save/get/list/update/delete。
- [ ] 4.2 定义 session event 类型，支持 `session.started`、`turn.completed`、`correction.dismissed`、`session.ending`、`summary.completed`、`session.abandoned`、`session.failed`、`provider.schema_failed`。
- [ ] 4.3 创建 `src/lib/practice-session/index.ts`，统一导出 schema、types、state、memory 和 repository 接口。

## 5. Tests

- [ ] 5.1 创建 `src/lib/practice-session/schema.test.ts`，验证 session、turn、rolling summary、memory snapshot 和 event schema。
- [ ] 5.2 创建 `src/lib/practice-session/state.test.ts`，验证允许转换和非法转换。
- [ ] 5.3 创建 `src/lib/practice-session/memory.test.ts`，验证最近 turns 截断、rolling summary 保留、current user input、压缩触发阈值和不 mutate 原始 session。
- [ ] 5.4 测试 repository interface 只作为类型边界，不引入具体 localStorage/IndexedDB/server database 实现。

## 6. Verification

- [ ] 6.1 运行 `npm test`，确认现有 agent-skill-contracts 测试和新增 practice-session 测试均通过。
- [ ] 6.2 运行 `npm run lint`，确认新增 TypeScript 不引入 lint 错误。
- [ ] 6.3 运行 `npm run build`，确认 Next.js 项目可构建。
- [ ] 6.4 运行 `openspec status --change add-practice-session-flow`，确认 proposal、design、specs、tasks 均已就绪。
