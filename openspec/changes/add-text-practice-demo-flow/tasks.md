## 1. API Contracts

- [ ] 1.1 创建 `src/lib/text-practice-flow/types.ts`，定义 create session、submit turn、end session、get session 的 request/response schema。
- [ ] 1.2 明确 response 不包含 API key、provider secret、Authorization header、hidden reasoning 或 chain-of-thought。
- [ ] 1.3 对齐已有 Scenario、PracticeSession、CorrectionDecision、PracticeSummary 和 local history 合同。

## 2. Server Orchestrator

- [ ] 2.1 创建 `src/lib/text-practice-flow/orchestrator.server.ts`，实现 create session flow。
- [ ] 2.2 实现 submit turn flow：校验 active session、构建 memory snapshot、运行 practice skill、生成 correction candidate、执行 ReAct quality decision、append turn。
- [ ] 2.3 实现 end session flow：active -> ending、final assessment、correction aggregation、summary、ending -> completed、local history save。
- [ ] 2.4 默认使用 mock provider，确保没有通义 key 也能运行。
- [ ] 2.5 provider schema failure 或 ReAct high risk 时，不追加 unsafe assistant reply。

## 3. Next Route Handlers

- [ ] 3.1 创建 `src/app/api/practice-sessions/route.ts`，实现 `POST /api/practice-sessions`。
- [ ] 3.2 创建 `src/app/api/practice-sessions/[sessionId]/route.ts`，实现 `GET /api/practice-sessions/:id`。
- [ ] 3.3 创建 `src/app/api/practice-sessions/[sessionId]/turns/route.ts`，实现 `POST /api/practice-sessions/:id/turns`。
- [ ] 3.4 创建 `src/app/api/practice-sessions/[sessionId]/end/route.ts`，实现 `POST /api/practice-sessions/:id/end`。
- [ ] 3.5 返回清晰错误：unknown scenario、missing session、inactive session、empty user text、summary failed、history save failed。

## 4. Minimal Next Demo Page

- [ ] 4.1 修改 `src/app/page.tsx`，提供场景选择、session 状态、对话消息区、文本输入、结束练习按钮、轻纠错展示区、总结展示区。
- [ ] 4.2 页面不包含 microphone、ASR、TTS、WebRTC、WebSocket 或 realtime audio 控件。
- [ ] 4.3 本地历史入口只做简单预留，不实现完整历史管理页。
- [ ] 4.4 UI 文案中文优先，练习对话内容英文优先。

## 5. Tests

- [ ] 5.1 创建 `src/lib/text-practice-flow/orchestrator.test.ts`，验证 create、submit turn、end session 正常链路。
- [ ] 5.2 测试 turn orchestration：empty text rejected、inactive session rejected、correction decision show/suppress/defer。
- [ ] 5.3 测试 end orchestration：summary before completed、summary failure 不标记 completed、history save failure 返回 `savedToHistory: false`。
- [ ] 5.4 测试 mock provider default：没有 `DASHSCOPE_API_KEY` 或 `QWEN_API_KEY` 也能跑通。
- [ ] 5.5 测试 secret safety：API responses、session、turn、summary、history 不包含 API key、provider secret、Authorization header、hidden reasoning、chain-of-thought。
- [ ] 5.6 测试 routes 返回正确错误码和结构化错误。

## 6. Verification

- [ ] 6.1 运行 `npm test`，确认现有测试和新增 text-practice-flow 测试均通过。
- [ ] 6.2 运行 `npm run lint`，确认新增 TypeScript/React 不引入 lint 错误。
- [ ] 6.3 运行 `npm run build`，确认 Next.js 项目可构建。
- [ ] 6.4 运行 `openspec status --change add-text-practice-demo-flow`，确认 proposal、design、specs、tasks 均已就绪。
