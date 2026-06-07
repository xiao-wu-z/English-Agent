## 1. Storage Schema

- [ ] 1.1 创建 `src/lib/practice-history/schema.ts`，定义 storage key、storage version、history payload、practice session list item 和 storage error code 的 schema/types。
- [ ] 1.2 定义 `PracticeSessionListItem`，包含 id、scenarioId、scenarioVersion、可选 scenarioTitleZh、status、startedAt、可选 endedAt、turnCount、可选 overallScore、可选 summaryPreview、updatedAt。
- [ ] 1.3 对齐 `add-practice-session-flow` 的 `PracticeSession` schema，确保存储 sessions 使用同一 session 合同。

## 2. LocalStorage Repository

- [ ] 2.1 创建 `src/lib/practice-history/local-storage.ts`，实现 `LocalPracticeSessionRepository`。
- [ ] 2.2 实现 `saveSession(session)`，保存前校验 session 和 forbidden data。
- [ ] 2.3 实现 `getSession(sessionId)`，存在返回完整 session，不存在返回 undefined。
- [ ] 2.4 实现 `listSessions()`，返回 `PracticeSessionListItem[]`，不返回完整 turns。
- [ ] 2.5 实现 `updateSession(session)`，替换已有 session 并更新 payload updatedAt。
- [ ] 2.6 实现 `deleteSession(sessionId)`，删除存在 session，缺失时幂等成功。

## 3. Capacity And Safety

- [ ] 3.1 实现 pruning policy：最多 50 条 session。
- [ ] 3.2 实现 failed session policy：最多保留最近 10 条 failed session。
- [ ] 3.3 总量超限时优先裁剪最旧 completed / abandoned session。
- [ ] 3.4 实现 forbidden data validation，禁止 raw audio、API key、provider secret、Authorization header、provider raw secret config、hidden reasoning、chain-of-thought、reasoning trace、thought 字段。

## 4. Error Handling

- [ ] 4.1 定义 local history error 类型，支持 `parse_failed`、`schema_validation_failed`、`quota_exceeded`、`storage_unavailable`。
- [ ] 4.2 JSON parse 失败时抛 `parse_failed`，不静默清空历史。
- [ ] 4.3 schema validation 失败时抛 `schema_validation_failed`。
- [ ] 4.4 localStorage 不可用时抛 `storage_unavailable`。
- [ ] 4.5 写入 quota 失败时抛 `quota_exceeded`。

## 5. Public Exports And Tests

- [ ] 5.1 创建 `src/lib/practice-history/index.ts`，导出 schema、types、repository 和 constants。
- [ ] 5.2 创建 `src/lib/practice-history/schema.test.ts`，验证 storage payload、list item 和 error code schema。
- [ ] 5.3 创建 `src/lib/practice-history/local-storage.test.ts`，使用 mock Storage 验证 save/get/list/update/delete。
- [ ] 5.4 测试 pruning：总量 50、failed 最多 10、completed/abandoned 优先裁剪。
- [ ] 5.5 测试 forbidden data：raw audio、API key、Authorization header、hidden reasoning 和 chain-of-thought 被拒绝。
- [ ] 5.6 测试错误处理：parse_failed、schema_validation_failed、quota_exceeded、storage_unavailable。

## 6. Verification

- [ ] 6.1 运行 `npm test`，确认现有测试和新增 practice-history 测试均通过。
- [ ] 6.2 运行 `npm run lint`，确认新增 TypeScript 不引入 lint 错误。
- [ ] 6.3 运行 `npm run build`，确认 Next.js 项目可构建。
- [ ] 6.4 运行 `openspec status --change add-local-practice-history`，确认 proposal、design、specs、tasks 均已就绪。
