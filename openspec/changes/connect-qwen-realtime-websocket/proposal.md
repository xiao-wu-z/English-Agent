## Why

当前语音模式仍是 mock-first 骨架：UI 有语音模式、provider 有 realtime 接口，但没有真正连接 Qwen realtime WebSocket，也没有把浏览器麦克风音频送到真实模型。用户已经明确指出这不是真正语音功能。

现在本地 `.env.local` 已配置 Qwen realtime 所需环境变量，下一步需要打通真实链路：浏览器录音、Next server bridge、Qwen realtime WebSocket、SSE 事件流、前端真实 transcript 和 audio delta 处理。

## What

- 使用 server-only `DASHSCOPE_API_KEY` / `QWEN_API_KEY` 创建 Qwen realtime WebSocket。
- 连接模型 `qwen3.5-omni-plus-realtime`。
- 用 SSE 作为前端事件接收方式。
- 前端通过 MediaRecorder 采集音频 chunk。
- 前端通过 Next API route 发送 audio chunks，不直接调用 Qwen。
- Server 将 Qwen events 归一化为现有 `RealtimeProviderEvent`。
- 前端展示真实 user transcript 和 assistant transcript。
- 前端处理 audio delta 播放队列；播放失败时回退 transcript-only。
- mock provider 继续作为无 key fallback。

## Impact

- 扩展 `qwen-realtime-voice-provider`，从配置边界升级为真实 WebSocket provider。
- 扩展 `realtime-voice-practice-ui`，从 mock 事件流升级到真实 SSE event stream。
- 不保存原始音频。
- 不把 API key 暴露到前端、prompt、history、badcase 或日志。
