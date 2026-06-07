## Context

真实语音链路比文本链路更容易失败。用户可能拒绝麦克风权限，浏览器可能不支持 MediaRecorder，Qwen WebSocket 可能连接失败，SSE 可能断开，audio chunks 可能发送失败，模型可能没有返回 transcript 或 assistant response。

`connect-qwen-realtime-websocket` 负责打通真实链路；本 change 负责定义链路失败时如何检测、降级和恢复。

## Goals / Non-Goals

**Goals:**

- 定义 voice session health state。
- 定义 timeout 类型和默认阈值。
- 定义恢复动作。
- 定义 fallback to text mode。
- 定义 partial transcript 保存策略。
- 定义 safe user-facing error messages。
- 定义 cleanup 行为。
- 定义 badcase trigger points。

**Non-Goals:**

- 不做复杂多次自动重连。
- 不做网络质量仪表盘。
- 不做详细音频诊断。
- 不做跨设备恢复。
- 不做服务端持久化队列。
- 不保存音频文件。
- 不实现 provider 本身。

## Decisions

### Decision 1: 使用 health state 表示语音链路质量

Health 状态：

```text
healthy
degraded
recovering
fallback_text
failed
```

语义：

- `healthy`: 语音链路正常。
- `degraded`: 有异常但仍可继续，例如一次 SSE idle 或单个 audio chunk 失败。
- `recovering`: 正在执行恢复动作，例如 restart SSE。
- `fallback_text`: 语音链路不可用，切换到文本练习。
- `failed`: 无法继续，session 失败或需要用户重新开始。

### Decision 2: Timeout 类型显式化

Timeout 类型：

```text
microphone_permission_timeout
qwen_connect_timeout
no_user_speech_timeout
no_assistant_response_timeout
sse_idle_timeout
audio_send_timeout
summary_timeout
```

默认阈值建议：

```text
microphone_permission_timeout: 15000 ms
qwen_connect_timeout: 15000 ms
no_user_speech_timeout: 20000 ms
no_assistant_response_timeout: 30000 ms
sse_idle_timeout: 45000 ms
audio_send_timeout: 10000 ms
summary_timeout: 30000 ms
```

### Decision 3: 恢复动作是有限集合

恢复动作：

```text
retry_connect
restart_sse
flush_audio_queue
fallback_to_text
mark_session_failed
save_partial_transcript
show_safe_error
```

MVP 不做无限重试。每类自动恢复最多一次，重复失败后 fallback 或 failed。

### Decision 4: fallback_text 是一等结果

当语音链路不可用但已有 transcript 或用户仍可继续练习时，应切到文本模式，而不是直接失败。

典型场景：

- MediaRecorder 不支持。
- Qwen connect timeout。
- repeated SSE disconnect。
- no transcript after audio input。
- assistant response timeout。

fallback 时要保留已有 transcript，不保存原始音频。

### Decision 5: Badcase 只记录证据摘要，不记录音频

触发点：

- Qwen connection failed。
- repeated SSE disconnect。
- no transcript after audio input。
- provider event parse failure。
- assistant response timeout。
- fallback to text mode。
- summary failed after voice session。

Badcase signal 应包含 session/scenario/skill/turn attribution 和安全摘要，不包含 raw audio blob、API key 或 provider secret。

## Proposed Modules

- `src/lib/realtime-voice-recovery/schema.ts`
  - health state、timeout type、recovery action、recovery event schema。
- `src/lib/realtime-voice-recovery/policy.ts`
  - default timeout thresholds、retry limits。
- `src/lib/realtime-voice-recovery/decision.ts`
  - timeout/error -> recovery action mapping。
- `src/lib/realtime-voice-recovery/messages.ts`
  - safe user-facing messages。
- `src/lib/realtime-voice-recovery/index.ts`
  - public exports。

## Data Flow

```text
voice UI / server bridge event
        ↓
quality/recovery policy
        ↓
health state update
        ↓
recovery action
        ↓
restart_sse / retry_connect / fallback_to_text / failed
        ↓
optional badcase signal
```

## Error Handling

- First SSE disconnect: health -> degraded, action -> restart_sse。
- Repeated SSE disconnect: health -> fallback_text or failed。
- Qwen connect timeout: action -> retry_connect once, then fallback_text。
- No transcript after audio input: fallback_text and optional badcase。
- No assistant response: show safe error and fallback_text。
- Summary timeout: mark session failed or save partial transcript。

## Safety

- Recovery events must not contain API key。
- Recovery events must not contain Authorization header。
- Recovery events must not contain raw audio。
- Badcase signal must store only safe evidence summary。
- User-facing messages should be understandable and not expose provider internals.

## Risks / Trade-offs

- [Risk] Too much fallback may hide provider issues → Mitigation: badcase trigger records safe evidence.
- [Risk] Too aggressive timeout interrupts slow responses → Mitigation: conservative default thresholds.
- [Risk] Recovery module duplicates UI state → Mitigation: health state is quality layer; UI state remains interaction layer.
- [Risk] No automatic deep reconnect → Mitigation: MVP prioritizes predictable failure and text fallback.

## Migration Plan

No migration is required.

Implementation order:

1. Define schemas and types。
2. Define default timeout policy。
3. Implement recovery decision mapping。
4. Implement safe user-facing messages。
5. Integrate into voice UI and Qwen session bridge in later implementation。

## Open Questions

- Whether fallback should automatically switch UI to text tab or ask user first. Current recommendation: ask user with a clear fallback action.
- Whether repeated SSE disconnect means two or three disconnects. Current recommendation: two disconnects in one session.
