## 1. Qwen WebSocket Provider

- [x] 1.1 创建 `src/lib/model-providers/server/qwen-realtime-websocket.ts`，实现 Qwen realtime WebSocket provider。
- [x] 1.2 使用 `QWEN_REALTIME_MODEL`，默认 `qwen3.5-omni-plus-realtime`。
- [x] 1.3 从 `DASHSCOPE_API_KEY` 或 `QWEN_API_KEY` 读取 server-only key。
- [x] 1.4 连接 `wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=<model>`。
- [x] 1.5 连接失败时返回 safe `session_create_failed`。

## 2. Qwen Event Normalization

- [x] 2.1 实现 Qwen event parser，将 provider-specific events 转成 `RealtimeProviderEvent`。
- [x] 2.2 映射 user partial/final transcript。
- [x] 2.3 映射 assistant partial/final transcript。
- [x] 2.4 映射 assistant audio payload 为 `audio.delta`。
- [x] 2.5 未知事件安全忽略或转成 safe error event。
- [x] 2.6 parser 错误不暴露 secret、Authorization header 或 raw provider config。

## 3. Server Session Bridge

- [x] 3.1 创建 session bridge 能力（实现于 `src/lib/realtime-voice-flow/orchestrator.server.ts`）。
- [x] 3.2 使用 in-memory session map 管理 Qwen WebSocket、session status 和 SSE subscribers。
- [x] 3.3 实现 create session、send audio chunk、close session。
- [x] 3.4 实现 event fanout，将 normalized events 推送给 SSE subscribers。
- [x] 3.5 SSE client disconnect 时移除 subscriber。

## 4. Next Routes

- [x] 4.1 更新 `POST /api/realtime-practice-sessions`，真实创建 Qwen session 或 mock fallback。
- [x] 4.2 更新 `POST /api/realtime-practice-sessions/:id/audio`，转发 audio chunks 到 active session。
- [x] 4.3 更新 `GET /api/realtime-practice-sessions/:id/events`，返回 `text/event-stream`。
- [x] 4.4 新增 `POST /api/realtime-practice-sessions/:id/end`，关闭 WebSocket session。
- [x] 4.5 route responses 和 SSE events 不包含 API key、Authorization header 或 provider secret。

## 5. Browser Voice UI

- [x] 5.1 更新 voice mode，使用 `navigator.mediaDevices.getUserMedia` 请求麦克风。
- [x] 5.2 使用 MediaRecorder 生成 audio chunks。
- [x] 5.3 将 audio chunks POST 到 app audio route。
- [x] 5.4 使用 `EventSource` 订阅 `/events` SSE。
- [x] 5.5 根据 SSE normalized events 更新 user transcript、assistant transcript、audio queue 和 voice state。
- [x] 5.6 audio playback 失败时回退 transcript-only。
- [x] 5.7 保留 mock fallback。

## 6. Tests

- [x] 6.1 测试 Qwen config：缺 key 返回 `missing_api_key`，模型默认值正确。
- [x] 6.2 测试 Qwen event normalization：transcript、audio delta、unknown event。
- [x] 6.3 测试 session bridge：subscriber fanout、disconnect cleanup、close session。
- [x] 6.4 测试 SSE route headers 和 event format。
- [x] 6.5 测试 audio route empty chunk 和 missing session。
- [x] 6.6 测试 secret safety：events/errors 不包含 API key、Authorization header 或 secret config。
- [x] 6.7 测试 mock provider 仍为默认 fallback。

## 7. Verification

- [x] 7.1 运行 `npm test`，确认现有测试和新增 Qwen realtime tests 均通过。
- [x] 7.2 运行 `npm run lint`，确认新增 TypeScript/React 不引入 lint 错误。
- [x] 7.3 运行 `npm run build`，确认 Next.js 项目可构建。
- [x] 7.4 运行 `openspec status --change connect-qwen-realtime-websocket`，确认 proposal、design、specs、tasks 均已就绪。
