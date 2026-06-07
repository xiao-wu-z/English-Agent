## 1. Timer State

- [x] 1.1 创建 `src/lib/realtime-voice-recovery/timers.ts` 或 UI helper。
- [x] 1.2 定义 timer keys。
- [x] 1.3 实现 start/clear/clearAll timer helper。
- [x] 1.4 确保 session cancel/end 清理 timers。

## 2. UI Integration

- [x] 2.1 麦克风权限请求启动 permission timeout。
- [x] 2.2 Qwen session 创建启动 connect timeout。
- [x] 2.3 SSE event 到达刷新 idle timeout。
- [x] 2.4 audio chunk 成功发送后启动 no transcript timeout。
- [x] 2.5 user transcript final 后启动 assistant response timeout。
- [x] 2.6 assistant transcript final 后清理 assistant timeout。

## 3. Recovery Actions

- [x] 3.1 `restart_sse` 重建 EventSource。
- [x] 3.2 repeated SSE failure -> fallback text。
- [x] 3.3 no transcript -> fallback text。
- [x] 3.4 assistant timeout -> show safe error。
- [x] 3.5 fallback/end 清理录音和 audio context。

## 4. Badcase

- [x] 4.1 timeout recovery 生成 safe badcase signal。
- [x] 4.2 badcase 不包含 raw audio、API key、Authorization header。

## 5. Tests

- [x] 5.1 测试 timer helper。
- [x] 5.2 测试 timeout -> recovery decision。
- [x] 5.3 测试 repeated SSE failure。
- [x] 5.4 测试 clearAll。
- [x] 5.5 测试 safe badcase signal。

## 6. Verification

- [x] 6.1 运行 `npm test`。
- [x] 6.2 运行 `npm run lint`。
- [x] 6.3 运行 `npm run build`。
- [x] 6.4 运行 `openspec status --change add-voice-recovery-ui-timers`。
