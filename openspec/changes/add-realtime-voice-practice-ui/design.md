## Context

文本版练习能验证业务闭环，但语音陪练需要浏览器音频和实时事件。Qwen realtime provider change 负责 provider 接口和 normalized events；本 change 负责前端语音练习体验和 UI 状态管理。

V1 不追求最低延迟和完整音频工程能力。为了尽快落地 Demo，音频输入建议先用 `MediaRecorder`，后续如果延迟或格式不满足，再单独引入 `AudioWorklet`。

## Goals / Non-Goals

**Goals:**

- 定义语音练习 UI 状态机。
- 定义麦克风权限流程。
- 定义 MediaRecorder 音频输入边界。
- 定义 provider event bridge。
- 展示用户 partial/final transcript。
- 展示 AI partial/final transcript。
- 支持 AI 音频播放队列边界。
- 在用户 final transcript 后最多展示一条中文轻纠错。
- 支持结束练习、取消练习和课后 summary。
- 默认 mock realtime provider 可跑通 UI 事件流。

**Non-Goals:**

- 不实现复杂断线重连。
- 不实现音频波形可视化。
- 不实现完整评测仪表盘。
- 不实现跨设备历史。
- 不实现长期记忆。
- 不实现多语言 UI。
- 不保存原始音频。
- 不让前端直接调用通义。
- 不把真实 API key 写入仓库。

## Decisions

### Decision 1: Voice UI 状态机显式建模

状态集合：

```text
idle
requesting_microphone
ready
connecting
listening
thinking
speaking
ending
completed
failed
abandoned
```

状态语义：

- `idle`: 尚未开始。
- `requesting_microphone`: 正在请求麦克风权限。
- `ready`: 麦克风可用，等待连接 provider。
- `connecting`: 正在创建 realtime session。
- `listening`: 正在接收用户语音。
- `thinking`: 等待 AI 回复。
- `speaking`: AI 正在输出文本或音频。
- `ending`: 正在结束 session 和生成 summary。
- `completed`: 正常完成。
- `failed`: 系统错误。
- `abandoned`: 用户取消。

### Decision 2: MVP 音频输入使用 MediaRecorder

V1 使用 browser `MediaRecorder`：

- 请求麦克风权限。
- 分片生成 audio chunks。
- chunks 发送给后端 session route/provider bridge。
- 不保存 audio blob 到 local history。

不在本 change 中使用 `AudioWorklet`。如果后续需要更低延迟或 PCM 细粒度控制，再开独立 change。

### Decision 3: 前端只连接自己的 Next API

前端不得直接调用通义 realtime endpoint。所有 provider session、audio chunk、text event 都通过自己的 Next route 或 server bridge。

这样可以保证：

- API key 只在 server-only 模块读取。
- provider 事件先被 normalize。
- session 状态和 badcase/summary hook 可控。

### Decision 4: Provider events 映射到 UI state

事件映射：

```text
session.created -> ready/listening
transcript.user.partial -> user partial caption
transcript.user.final -> user final turn
transcript.assistant.partial -> assistant partial caption
transcript.assistant.final -> assistant message
audio.delta -> playback queue
interruption -> stop playback / listening
error -> failed
session.closed -> completed or abandoned
```

`transcript.user.final` 是触发 turn-level correction 的合适时机。

### Decision 5: 实时轻纠错用中文且不打断语音

实时轻纠错规则：

- 用户说话期间不展示弹层。
- 只在 `transcript.user.final` 后展示。
- 每个 user final turn 最多展示一条。
- 只展示 high confidence 且 low/medium risk 的纠错。
- 解释文案使用中文。
- low/medium confidence 进入 summary，不实时展示。

### Decision 6: 音频输出先做播放队列边界

UI 应维护 audio playback queue，消费 `audio.delta` 事件。MVP 不做复杂可视化，不要求完整波形，也不做高级打断混音。播放失败时回退展示 AI 文本。

### Decision 7: Summary 仍复用 session end flow

语音练习结束后，仍然进入已有 session end orchestration：

```text
ending -> final assessment -> correction aggregation -> summary -> completed -> local history
```

语音链路只影响 turn 输入来源和 AI 输出通道，不改变课后 summary 合同。

## Proposed Modules

- `src/lib/realtime-voice-ui/state.ts`
  - voice UI state、transition helpers。
- `src/lib/realtime-voice-ui/events.ts`
  - provider event -> UI state/action mapping。
- `src/lib/realtime-voice-ui/audio.ts`
  - MediaRecorder boundary、audio chunk validation、no-persist rules。
- `src/lib/realtime-voice-ui/corrections.ts`
  - after-final-transcript correction display policy。
- `src/app/api/realtime-practice-sessions/route.ts`
  - create realtime practice session bridge。
- `src/app/api/realtime-practice-sessions/[sessionId]/audio/route.ts`
  - receive audio chunks.
- `src/app/api/realtime-practice-sessions/[sessionId]/events/route.ts`
  - event stream bridge or polling boundary.
- `src/app/page.tsx`
  - add voice mode tab or section, while preserving text demo.

## Data Flow

```text
Next voice UI
        ↓
request microphone
        ↓
MediaRecorder chunks
        ↓
Next realtime session routes
        ↓
RealtimeModelProvider
        ↓
normalized provider events
        ↓
UI transcript / playback / correction state
        ↓
end session
        ↓
summary + local history
```

## Error Handling

- Microphone permission denied: state -> failed with user-facing message.
- MediaRecorder unsupported: state -> failed with fallback text practice suggestion.
- Audio chunk invalid: do not send, surface safe error.
- Provider event error: state -> failed or show retry-safe message.
- Session closed unexpectedly: state -> failed unless user explicitly ended.
- Playback failure: continue with transcript text.
- End summary failure: do not mark completed; show safe error.

## Safety

- Frontend does not receive API key.
- Frontend does not call provider endpoint directly.
- Audio blobs are not saved to local history.
- Prompt/history/logs do not include API key or hidden reasoning.
- Provider errors shown to user are safe and do not include secret config.

## Risks / Trade-offs

- [Risk] MediaRecorder latency may be higher than ideal → Mitigation: acceptable for MVP; AudioWorklet follow-up if needed.
- [Risk] Event stream route can become complex → Mitigation: first implementation can use mock/polling/SSE boundary; complex reconnect is out of scope.
- [Risk] Voice UI expands page complexity → Mitigation: add voice mode as focused section/tab and keep text flow intact.
- [Risk] Realtime correction interrupts conversation → Mitigation: only display after user final transcript and never while listening.

## Migration Plan

No migration is required.

Implementation order:

1. Define voice UI state schema and transitions.
2. Define provider event to UI mapping.
3. Define MediaRecorder boundary helpers.
4. Define correction display policy.
5. Add realtime session route boundaries.
6. Add voice mode UI using mock realtime provider.
7. Verify text demo remains functional.

## Open Questions

- Event bridge should use SSE, polling, or WebSocket for the first UI implementation. Current recommendation: start with the simplest route compatible with mock provider; choose final transport when real Qwen implementation is active.
- Whether voice mode should share the existing page or move to `/voice`. Current recommendation: keep a single page with mode tabs for MVP.
