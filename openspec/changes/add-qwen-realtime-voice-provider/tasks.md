## 1. Realtime Provider Types

- [ ] 1.1 创建 `src/lib/model-providers/realtime-types.ts`，定义 realtime session、event、provider interface、error code 和 error class。
- [ ] 1.2 定义 event types：`session.created`、`transcript.user.partial`、`transcript.user.final`、`transcript.assistant.partial`、`transcript.assistant.final`、`audio.delta`、`interruption`、`error`、`session.closed`。
- [ ] 1.3 定义 error codes：`missing_api_key`、`session_create_failed`、`event_parse_failed`、`audio_chunk_invalid`、`connection_closed`、`timeout`、`unsupported_provider`。

## 2. Mock Realtime Provider

- [ ] 2.1 创建 `src/lib/model-providers/server/realtime-mock.ts`。
- [ ] 2.2 实现 `createSession`，返回 mock session。
- [ ] 2.3 实现 `sendText`，产生 deterministic user final transcript 和 assistant final transcript events。
- [ ] 2.4 实现 `sendAudioChunk`，校验 chunk 非空，可产生 deterministic placeholder event。
- [ ] 2.5 实现 `endSession` 和 `onEvent`。

## 3. Qwen Realtime Provider Boundary

- [ ] 3.1 创建 `src/lib/model-providers/server/qwen-realtime.ts`。
- [ ] 3.2 实现 Qwen realtime config resolver，默认 `QWEN_REALTIME_MODEL=qwen3.5-omni-plus-realtime`。
- [ ] 3.3 从 `DASHSCOPE_API_KEY` 或 `QWEN_API_KEY` 读取 server-only key。
- [ ] 3.4 `MODEL_PROVIDER=qwen` 且缺 key 时抛 `missing_api_key`。
- [ ] 3.5 不在本 change 中实现完整 WebRTC/WebSocket UI。

## 4. Realtime Registry And Exports

- [ ] 4.1 创建 `src/lib/model-providers/server/realtime-registry.ts`，实现 `resolveRealtimeProvider(env)`。
- [ ] 4.2 默认返回 mock realtime provider。
- [ ] 4.3 未知 provider 抛 `unsupported_provider`。
- [ ] 4.4 更新 client-safe exports，只导出类型，不导出 server secret readers。

## 5. Tests

- [ ] 5.1 创建 `src/lib/model-providers/realtime.test.ts`，验证 realtime session/event/error schema。
- [ ] 5.2 测试默认 mock provider 不需要 API key。
- [ ] 5.3 测试 mock `sendText` 产生 user/assistant transcript events。
- [ ] 5.4 测试 empty audio chunk 抛 `audio_chunk_invalid`。
- [ ] 5.5 测试 `MODEL_PROVIDER=qwen` 且缺 key 时抛 `missing_api_key`。
- [ ] 5.6 测试 unknown provider 抛 `unsupported_provider`。
- [ ] 5.7 测试 provider errors 和 events 不包含 API key、Authorization header 或 secret config。

## 6. Verification

- [ ] 6.1 运行 `npm test`，确认现有测试和新增 realtime provider 测试均通过。
- [ ] 6.2 运行 `npm run lint`，确认新增 TypeScript 不引入 lint 错误。
- [ ] 6.3 运行 `npm run build`，确认 Next.js 项目可构建。
- [ ] 6.4 运行 `openspec status --change add-qwen-realtime-voice-provider`，确认 proposal、design、specs、tasks 均已就绪。
