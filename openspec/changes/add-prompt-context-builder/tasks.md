## 1. Prompt Context Types

- [ ] 1.1 创建 `src/lib/prompt-context/types.ts`，定义 `PromptMessage`、`PromptContextBundle`、`PromptContextMetadata`、builder input 和 builder options 类型。
- [ ] 1.2 定义 Tier 1、Tier 2、Tier 3 的结构化类型，确保 bundle 能保留层级边界。
- [ ] 1.3 复用或对齐 Agent Skill Runtime 的 expected output schema name 类型，避免重复定义不一致的 schema 名。

## 2. Prompt Context Builder

- [ ] 2.1 创建 `src/lib/prompt-context/builder.ts`，实现 `buildPromptContextBundle`。
- [ ] 2.2 校验必需输入：core rules、scenario id、scenario version、active skill id、active skill instruction、expected output schema name。
- [ ] 2.3 实现 provider-neutral safety validation，拒绝 provider/model/API key/transport 细节进入 prompt-facing inputs。
- [ ] 2.4 实现 recent turn limit 和 badcase hint limit，默认 recent turns 为 6，badcase hints 为 3。
- [ ] 2.5 生成 metadata：scenario id、scenario version、skill id、included tiers、recent turn count、badcase hint count、estimated chars、expected output schema name。

## 3. Prompt Message Renderer

- [ ] 3.1 创建 `src/lib/prompt-context/render.ts`，实现 `renderPromptMessages(bundle)`。
- [ ] 3.2 将 Tier 1 渲染为 system message。
- [ ] 3.3 将 Tier 2 渲染为 scenario context、active skill instruction 和 expected output schema name。
- [ ] 3.4 将 Tier 3 渲染为 conversation memory snapshot、relevant badcase hints 和 current task input。
- [ ] 3.5 确认 `PromptMessage` 只包含 role 和 content，不包含 provider/model/endpoint/API key/transport 参数。

## 4. Public Exports

- [ ] 4.1 创建 `src/lib/prompt-context/index.ts`，导出 types、builder 和 renderer。
- [ ] 4.2 确认该模块不导入 provider adapter、server-only secret config、session repository 或 UI 代码。

## 5. Tests

- [ ] 5.1 创建 `src/lib/prompt-context/builder.test.ts`，验证 bundle 包含 T1/T2/T3、expected output schema name 和 metadata。
- [ ] 5.2 测试 active single skill：practice 请求不包含 assessment/correction/summary instruction；summary 请求不包含 practice/assessment/correction instruction。
- [ ] 5.3 测试 recent turns 和 badcase hints 按 limit 截断，且不 mutate 输入数据。
- [ ] 5.4 测试 provider-neutral safety：prompt-facing inputs 出现 Qwen、Tongyi、OpenAI、DashScope、WebRTC、WebSocket、model、endpoint 或 API key 时失败。
- [ ] 5.5 创建 `src/lib/prompt-context/render.test.ts`，验证 messages deterministic、Tier 1/Tier 2/Tier 3 渲染位置正确、message 只包含 role/content。
- [ ] 5.6 测试 metadata 不包含 transcript text、provider secret 或 raw model output。

## 6. Verification

- [ ] 6.1 运行 `npm test`，确认现有测试和新增 prompt-context 测试均通过。
- [ ] 6.2 运行 `npm run lint`，确认新增 TypeScript 不引入 lint 错误。
- [ ] 6.3 运行 `npm run build`，确认 Next.js 项目可构建。
- [ ] 6.4 运行 `openspec status --change add-prompt-context-builder`，确认 proposal、design、specs、tasks 均已就绪。
