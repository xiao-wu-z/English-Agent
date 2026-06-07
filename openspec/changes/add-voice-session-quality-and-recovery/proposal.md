## Why

真实 Qwen realtime WebSocket 接上后，语音链路会遇到更多运行态失败：麦克风权限失败、连接超时、SSE 断开、音频 chunk 发送失败、没有转写、AI 不响应、session 卡在 listening/thinking/speaking。没有质量监控和恢复策略时，Demo 很容易卡死或给用户不清晰的错误。

这个 change 为语音会话定义健康状态、超时策略、恢复动作、用户安全提示和 badcase 触发点，让真实语音链路失败时可以安全降级，尤其是 fallback 到文本模式。

## What

- 定义 voice session health state。
- 定义 timeout 类型和默认阈值。
- 定义 SSE disconnect、Qwen WebSocket close/error、audio send failure、empty transcript 的处理。
- 定义恢复动作：retry connect、restart SSE、flush audio queue、fallback to text、mark session failed、save partial transcript、show safe error。
- 定义用户可理解的错误提示。
- 定义 session cleanup。
- 定义 badcase trigger points。

## Impact

- 新增 `voice-session-quality-and-recovery` capability。
- 作为 `connect-qwen-realtime-websocket` 的稳定性补充。
- 后续 UI 和 server bridge 可统一使用这些状态和恢复动作。
- 不实现复杂多次自动重连、不做网络质量仪表盘、不保存音频文件。
