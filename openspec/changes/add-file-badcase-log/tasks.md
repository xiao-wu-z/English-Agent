## 1. Badcase Schema

- [ ] 1.1 创建 `src/lib/badcases/schema.ts`，定义 `BadcaseKind`、`BadcaseStatus`、`BadcaseSource`、`BadcaseSignal` 和 `BadcaseHint` 的 Zod schema 与 TypeScript 类型。
- [ ] 1.2 在 schema 中要求 `sessionId`、`scenarioId`、`scenarioVersion`、`skillId`、`createdAt` 和 `inputSnapshot` 必填。
- [ ] 1.3 校验 `createdAt` 为 ISO datetime，kind/status/source 只能取允许枚举。

## 2. JSONL Store

- [ ] 2.1 创建 `src/lib/badcases/store.ts`，实现 `getBadcaseFilePath` 和 kind 到 `correction.jsonl`、`assessment.jsonl`、`summary.jsonl`、`provider.jsonl` 的映射。
- [ ] 2.2 实现 `appendBadcaseSignal`，写入前校验 schema，自动创建目录，并以单行 compact JSON 追加。
- [ ] 2.3 实现 `readBadcaseSignals`，支持按文件类别读取，跳过空行，文件不存在时返回空数组。
- [ ] 2.4 读取遇到非法 JSON 时抛出包含文件路径和行号的清晰错误。

## 3. Badcase Hints

- [ ] 3.1 实现 `toBadcaseHint`，把 `BadcaseSignal` 转成 prompt-safe 的短 `BadcaseHint`。
- [ ] 3.2 确认 `BadcaseHint` 不包含完整 `inputSnapshot`。
- [ ] 3.3 实现 `getRelevantBadcaseHints`，支持按 `scenarioId`、`skillId`、kind 和 limit 过滤。
- [ ] 3.4 明确返回的 hints 用于未来三层 Prompt 的 Tier 3，不改当前 runtime。

## 4. 导出与目录

- [ ] 4.1 创建 `src/lib/badcases/index.ts`，统一导出 schema、类型和 store helper。
- [ ] 4.2 确认默认 root 为 `data/badcases`，测试可传自定义临时 root。
- [ ] 4.3 确认实现不依赖 SQLite、Redis、MySQL、向量库或网络调用。

## 5. 测试

- [ ] 5.1 创建 `src/lib/badcases/store.test.ts`，使用临时目录测试 append/read，不污染真实 `data/`。
- [ ] 5.2 测试 kind 到文件的映射。
- [ ] 5.3 测试一行一个 JSON、空行跳过、文件不存在返回空数组。
- [ ] 5.4 测试非法 JSON 抛出包含路径和行号的错误。
- [ ] 5.5 测试 `toBadcaseHint` 不泄露完整 inputSnapshot。
- [ ] 5.6 测试 `getRelevantBadcaseHints` 按 scenarioId、skillId、kind 和 limit 过滤。

## 6. 验证

- [ ] 6.1 运行 `npm test`，确认现有测试和 badcase 新测试均通过。
- [ ] 6.2 运行 `npm run lint`，确认新增 TypeScript 不引入 lint 错误。
- [ ] 6.3 运行 `npm run build`，确认 Next.js 项目可构建。
- [ ] 6.4 运行 `openspec status --change add-file-badcase-log`，确认 proposal、design、specs、tasks 均已就绪。
