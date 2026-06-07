## 1. ReAct Schemas

- [ ] 1.1 创建 `src/lib/react-orchestration/schema.ts`，定义 step type、step status、run status、decision action、reason code、loop policy、step、run 和 decision 的 Zod schema 与 TypeScript 类型。
- [ ] 1.2 在 schema 中禁止 `thought`、`chainOfThought`、`reasoningTrace` 等 hidden reasoning 字段。
- [ ] 1.3 对齐已有 Agent Skill Contracts，复用 confidence label、risk level 和 quality assessment 类型。

## 2. Loop Policy

- [ ] 2.1 创建 `src/lib/react-orchestration/policy.ts`，定义 default policy：`maxSteps=5`、`maxRetriesPerStep=1`、`maxProviderFailures=2`、`stopOnHighRisk=true`、`stopOnSchemaValidationFailureAfterRetry=true`。
- [ ] 2.2 实现 `canContinueReactRun(run)`，达到 maxSteps、session inactive 或 run terminal status 时返回 false。
- [ ] 2.3 实现 retry/failure limit helpers，确保 retry 和 provider failure 不会无限增长。
- [ ] 2.4 实现 `shouldStopReactRun(run, context)`，覆盖 high risk、schema retry failure、provider failure 和 session abandoned/failed。

## 3. Decision Helpers

- [ ] 3.1 创建 `src/lib/react-orchestration/decision.ts`，实现 `decideFromQualityGate(input)`。
- [ ] 3.2 高置信、低风险且 schema-valid 时允许 `show` 或 `final`。
- [ ] 3.3 低置信时优先 `suppress` 或 `defer_to_summary`，不默认 retry。
- [ ] 3.4 high hallucination risk 时禁止 `show`，并返回 `suppress`、`log_badcase` 或 `final`。
- [ ] 3.5 max steps reached 时返回 `max_steps_reached` reason code，并禁止继续 loop。

## 4. Public Exports

- [ ] 4.1 创建 `src/lib/react-orchestration/index.ts`，导出 schemas、types、policy helpers 和 decision helpers。
- [ ] 4.2 确认该模块不导入 provider adapter、prompt builder、UI、server-only secret config 或 realtime transport。

## 5. Tests

- [ ] 5.1 创建 `src/lib/react-orchestration/schema.test.ts`，验证 run、step、decision、policy schema，尤其是 hidden reasoning 字段被拒绝。
- [ ] 5.2 创建 `src/lib/react-orchestration/policy.test.ts`，验证 maxSteps、maxRetriesPerStep、maxProviderFailures、high risk stop、schema failure after retry、session abandoned/failed 停止条件。
- [ ] 5.3 创建 `src/lib/react-orchestration/decision.test.ts`，验证 high confidence show/final、low confidence suppress/defer、high hallucination risk 不 show、max steps reached 不 retry。
- [ ] 5.4 测试 badcase trigger mapping：provider schema failure、high risk output、max steps reached 均可产生 signal attribution。

## 6. Verification

- [ ] 6.1 运行 `npm test`，确认现有测试和新增 react-orchestration 测试均通过。
- [ ] 6.2 运行 `npm run lint`，确认新增 TypeScript 不引入 lint 错误。
- [ ] 6.3 运行 `npm run build`，确认 Next.js 项目可构建。
- [ ] 6.4 运行 `openspec status --change add-react-skill-orchestration`，确认 proposal、design、specs、tasks 均已就绪。
