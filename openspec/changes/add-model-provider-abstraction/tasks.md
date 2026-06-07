## 1. Provider 类型与错误

- [ ] 1.1 创建 `src/lib/model-providers/types.ts`，定义 `ModelProviderName`、`TextGenerationRequest`、`TextGenerationResult`、`TextModelProvider`、`RealtimeModelProvider`。
- [ ] 1.2 定义 `ModelProviderError` 和错误码：`missing_api_key`、`http_error`、`invalid_json`、`schema_validation_failed`、`provider_unavailable`、`unsupported_provider`。
- [ ] 1.3 确认错误消息不包含 API key、Authorization header 或 secret env value。

## 2. 结构化输出解析与校验

- [ ] 2.1 创建 `src/lib/model-providers/schemas.ts`，把 expected output schema name 映射到已有 `agent-skill-contracts` Zod schema。
- [ ] 2.2 创建 `src/lib/model-providers/json.ts`，实现 raw text JSON object 提取和 parse。
- [ ] 2.3 实现 `parseAndValidateModelOutput`，将 raw text 解析并用 strict Zod schema 校验。

## 3. Mock Provider

- [ ] 3.1 创建 `src/lib/model-providers/server/mock.ts`，为 practice guidance、assessment result、quality assessment、correction item、practice summary 提供 schema-valid fixtures。
- [ ] 3.2 确认 mock provider 是默认 provider，可在无 API key 环境运行。

## 4. OpenAI-Compatible Provider

- [ ] 4.1 创建 `src/lib/model-providers/server/openai-compatible.ts`，实现可复用 text provider。
- [ ] 4.2 provider 调用 `{baseUrl}/chat/completions`，传入 messages、model、`response_format: { type: "json_object" }`、temperature 和 max tokens。
- [ ] 4.3 provider 将 HTTP 错误、网络错误和异常包装成 `ModelProviderError`。

## 5. Qwen Provider

- [ ] 5.1 创建 `src/lib/model-providers/server/qwen.ts`，基于 OpenAI-compatible provider 配置通义百炼兼容模式。
- [ ] 5.2 Qwen provider 从 `QWEN_API_KEY` 或 `DASHSCOPE_API_KEY` 读取 key，从 `QWEN_BASE_URL` 读取 base URL，从 `QWEN_TEXT_MODEL` 读取 model。
- [ ] 5.3 未配置 key 且选择 qwen 时，返回 `missing_api_key` 错误。

## 6. Provider Registry

- [ ] 6.1 创建 `src/lib/model-providers/server/registry.ts`，根据 `MODEL_PROVIDER` 解析 provider，默认 `mock`。
- [ ] 6.2 支持显式 `MODEL_PROVIDER=qwen`。
- [ ] 6.3 未知 provider 名称返回 `unsupported_provider`。
- [ ] 6.4 创建 `src/lib/model-providers/index.ts`，只导出 client-safe 类型，不导出读取 secret 的 server 模块。

## 7. 测试

- [ ] 7.1 创建 `src/lib/model-providers/model-providers.test.ts`，测试 mock provider 对所有 expected output schema 都返回合法结果。
- [ ] 7.2 测试 JSON parser 可解析纯 JSON 和 markdown fenced JSON，并拒绝无效 JSON。
- [ ] 7.3 测试 schema-invalid JSON 和包含额外隐藏字段的 JSON 会失败。
- [ ] 7.4 测试默认 provider 为 mock、`MODEL_PROVIDER=qwen` 解析 qwen、未知 provider 报错。
- [ ] 7.5 测试 qwen 缺 key 时返回 `missing_api_key`，且错误不包含 secret。

## 8. 验证

- [ ] 8.1 运行 `npm test`，确认现有测试和 provider 新测试均通过。
- [ ] 8.2 运行 `npm run lint`，确认新增 TypeScript 不引入 lint 错误。
- [ ] 8.3 运行 `npm run build`，确认 Next.js 项目可构建。
- [ ] 8.4 运行 `openspec status --change add-model-provider-abstraction`，确认 proposal、design、specs、tasks 均已就绪。
