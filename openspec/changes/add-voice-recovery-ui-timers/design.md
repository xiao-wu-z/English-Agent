## Context

voice recovery 模块已经定义了状态和决策，但前端还缺少计时器。实际 Demo 中最常见的问题是“看起来卡住”：麦克风权限弹窗未处理、Qwen 连接慢、SSE 无事件、音频发送后没转写。

## Goals / Non-Goals

**Goals:**

- UI 管理 voice recovery timers。
- 每个 timeout 映射到 recovery decision。
- 重复 SSE disconnect fallback text。
- timeout 后清理录音资源。
- 展示中文 safe message。

**Non-Goals:**

- 不做复杂 retry backoff。
- 不实现后台任务系统。
- 不做生产 APM。

## Decisions

### Decision 1: UI timer state 轻量化

使用 React refs/timeouts 管理当前 voice session 的 timers。session 结束、取消、fallback 时统一 clear。

### Decision 2: Recovery action 只影响 UI 和 safe signal

`restart_sse` 可重建 EventSource；`fallback_to_text` 切换提示；`show_safe_error` 展示中文提示；`mark_session_failed` 进入 failed 状态。

## Timer Flow

```text
start voice session
  ↓
start microphone timer
  ↓
session connected -> clear connect timer
  ↓
audio sent -> start transcript timer
  ↓
user transcript received -> clear transcript timer, start assistant timer
  ↓
assistant transcript received -> clear assistant timer
  ↓
SSE event received -> refresh idle timer
```
