## Context

English-Agent 已经有文本练习闭环和 mock realtime voice UI。真实语音能力还缺少关键桥接层：Qwen realtime WebSocket 与浏览器音频流之间的 server-side session bridge。

本 change 采用 SSE，而不是让浏览器直接连接 Qwen。浏览器只连接自己的 Next API：

```text
Browser MediaRecorder
  -> POST audio chunks to Next route
  -> Next server session bridge
  -> Qwen realtime WebSocket
  -> normalize Qwen events
  -> SSE stream to browser
  -> UI transcript / audio queue
```

## Goals / Non-Goals

**Goals:**

- 实现 Qwen realtime WebSocket provider。
- 使用 `qwen3.5-omni-plus-realtime`。
- 从 server-only 环境读取 `DASHSCOPE_API_KEY` 或 `QWEN_API_KEY`。
- 新增/完善 realtime session bridge。
- `/events` 使用 SSE 推送 normalized `RealtimeProviderEvent`。
- `/audio` 接收 MediaRecorder chunks 并转发到 Qwen WebSocket。
- `/end` 关闭 Qwen WebSocket session。
- 前端接收 SSE 并展示真实 transcript。
- 前端尝试处理 audio delta，播放失败时回退 transcript-only。
- mock provider 保留为 fallback。

**Non-Goals:**

- 不做复杂断线重连。
- 不做音频波形可视化。
- 不保存原始音频。
- 不做音频降噪。
- 不做长期音频历史。
- 不做完整评测仪表盘。
- 不把 API key 暴露到前端。
- 不把真实 API key 写入代码、OpenSpec、测试或提交信息。

## Decisions

### Decision 1: Browser 使用 SSE 接收事件

前端事件接收使用：

```text
GET /api/realtime-practice-sessions/:id/events
```

该 route 返回 `text/event-stream`，每条 SSE data 是 normalized `RealtimeProviderEvent` JSON。

选择 SSE 的原因：

- 前端实现简单。
- 适合 server -> browser 的单向事件流。
- 音频上传仍走单独 POST route。
- 避免浏览器直接持有 provider secret。

### Decision 2: Audio upload 仍走 POST route

音频上传使用：

```text
POST /api/realtime-practice-sessions/:id/audio
```

前端 MediaRecorder 分片生成 audio chunks，逐片 POST 到 server bridge。Server bridge 将 chunk 转发给当前 session 的 Qwen WebSocket。

### Decision 3: Next server bridge 管理临时 session map

MVP 使用 server-side in-memory session map 管理：

- app session id
- Qwen WebSocket connection
- SSE subscribers
- session status
- recent normalized events

这是 Demo 级实现。生产级横向扩展、共享状态、断线恢复和多实例部署不在本 change 范围内。

### Decision 4: Qwen events 必须归一化

Qwen provider-specific event 不直接进入 UI。Server bridge 映射为现有 `RealtimeProviderEvent`：

```text
session.created
transcript.user.partial
transcript.user.final
transcript.assistant.partial
transcript.assistant.final
audio.delta
interruption
error
session.closed
```

未知或暂不支持的 Qwen event 应安全忽略或转为 safe error event，不泄露 raw secret config。

### Decision 5: Transcript 优先，audio playback 次之

优先级：

1. 真实麦克风输入。
2. 真实用户 transcript。
3. 真实 assistant transcript。
4. audio delta 进入播放队列。
5. 播放失败时回退 transcript-only。

如果 audio delta 格式暂时不能直接播放，不阻塞 transcript 闭环。

### Decision 6: MediaRecorder 格式先按浏览器默认发送

前端使用 MediaRecorder 默认输出，例如 `webm/opus`。Server bridge 需要按 Qwen 官方文档要求包装/转发音频。

如果 Qwen 要求 PCM16 或其他格式，而 MediaRecorder 输出不兼容，则本 change 应明确失败原因，并保留后续 `AudioWorklet` / transcoding change 的边界。

## Proposed Modules

- `src/lib/model-providers/server/qwen-realtime-websocket.ts`
  - Qwen realtime WebSocket provider。
  - session init。
  - send audio chunk。
  - normalize events。
  - close session。
- `src/lib/realtime-voice-flow/qwen-session-bridge.server.ts`
  - in-memory session map。
  - SSE subscriber registry。
  - audio forwarding。
  - event fanout。
- `src/app/api/realtime-practice-sessions/[sessionId]/events/route.ts`
  - SSE response。
- `src/app/api/realtime-practice-sessions/[sessionId]/audio/route.ts`
  - audio chunk POST。
- `src/app/api/realtime-practice-sessions/[sessionId]/end/route.ts`
  - close Qwen session。
- `src/app/page.tsx`
  - use MediaRecorder and EventSource for real voice mode.

## API Contract

```text
POST /api/realtime-practice-sessions
  body: { scenarioId }
  returns: { session: { id, scenarioId, providerSession } }

POST /api/realtime-practice-sessions/:id/audio
  body: binary audio chunk
  returns: { accepted: true }

GET /api/realtime-practice-sessions/:id/events
  returns: text/event-stream
  event data: RealtimeProviderEvent JSON

POST /api/realtime-practice-sessions/:id/end
  closes Qwen WebSocket session
```

## Data Flow

```text
User clicks start voice
        ↓
Browser requests microphone
        ↓
POST /api/realtime-practice-sessions
        ↓
Server creates Qwen WebSocket session
        ↓
Browser opens EventSource /events
        ↓
MediaRecorder sends POST /audio chunks
        ↓
Server forwards chunks to Qwen
        ↓
Qwen emits transcript/audio events
        ↓
Server normalizes and fans out SSE
        ↓
UI updates transcript, audio queue, correction state
```

## Error Handling

- Missing key: return safe `missing_api_key`.
- Qwen WebSocket connect failed: `session_create_failed`.
- Invalid audio chunk: `audio_chunk_invalid`.
- Qwen event parse failed: `event_parse_failed` safe event.
- Qwen connection closed: `connection_closed` event and UI failed/completed state.
- SSE client disconnect: remove subscriber, keep session alive until explicit end or timeout.
- Session not found: return 404 safe error.
- Audio playback failure: UI falls back to transcript-only.

## Security

- API key read only in server-only module.
- Browser never receives API key or Authorization header.
- SSE events must not include provider secret, raw request headers, or secret env values.
- Local history must not save raw audio.
- Prompt and badcase hints must not include raw audio or secrets.
- OpenSpec, source code, tests and commit messages must not include real API key.

## Risks / Trade-offs

- [Risk] Next Route Handler runtime may not be ideal for long-lived WebSocket + SSE sessions → Mitigation: MVP uses in-memory session map; if unstable, follow-up change can introduce a dedicated Node bridge server.
- [Risk] MediaRecorder format may not match Qwen requirements → Mitigation: transcript-first target; if incompatible, add AudioWorklet/transcoding follow-up.
- [Risk] SSE can only push server-to-client → Mitigation: audio upload uses POST route.
- [Risk] Multi-instance deployment breaks in-memory sessions → Mitigation: V1 local Demo only.

## Migration Plan

No migration is required.

Implementation order:

1. Implement Qwen realtime WebSocket provider.
2. Implement Qwen event normalization.
3. Implement server session bridge and SSE subscriber fanout.
4. Update audio route to forward chunks to Qwen session.
5. Add end route to close session.
6. Update voice UI to use `getUserMedia`, `MediaRecorder`, `EventSource`, and transcript/audio events.
7. Keep mock fallback when provider is mock or key is unavailable.

## Open Questions

- Exact Qwen event names and audio payload shape must be confirmed against official docs during implementation.
- Whether Qwen accepts browser `webm/opus` chunks directly or requires PCM16 framing. If PCM16 is required, implementation may need a follow-up audio processing change.
