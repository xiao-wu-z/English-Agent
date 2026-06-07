## Context

Qwen realtime WebSocket provider 已支持 `input_audio_buffer.append`，并把服务器事件归一化为 `RealtimeProviderEvent`。当前缺口在浏览器端：`MediaRecorder` 生成的压缩音频格式不符合 Qwen 的 `pcm` 输入要求。

本 change 聚焦浏览器端 PCM16 capture。实现后，语音模式优先使用 PCM capture；如果浏览器或设备不支持，则退回 MediaRecorder fallback，再由 audio format adapter 决定是否可直传或 fallback 到文本练习。

## Goals / Non-Goals

**Goals:**

- 实现 Float32 -> PCM16 编码 helper。
- 实现 mono mixdown。
- 实现 16 kHz 重采样。
- 实现浏览器 PCM capture session lifecycle。
- 将 PCM chunk 发送到现有 audio route。
- metadata 使用 `audio/pcm;rate=16000`、sequence、byteLength、sampleRate、channels。
- 失败时使用现有 recovery safe message。
- 不保存 raw audio。

**Non-Goals:**

- 不实现服务端 ffmpeg 转码。
- 不实现复杂降噪。
- 不实现客户端 VAD。
- 不实现 Qwen 输出音频播放。
- 不实现 WebRTC 白名单方案。
- 不持久化音频文件。

## Decisions

### Decision 1: PCM capture 优先，MediaRecorder fallback

语音模式启动时优先尝试 PCM capture。若 `AudioContext`、`AudioWorklet` 或麦克风权限不可用，则 fallback 到 MediaRecorder。MediaRecorder 输出若不被 provider 接受，则触发文本 fallback。

### Decision 2: 采集格式固定为 mono PCM16 16 kHz

发送到 server 的 metadata:

```ts
type AudioChunkMetadata = {
  mimeType: "audio/pcm;rate=16000";
  sequence: number;
  sampleRate: 16000;
  channels: 1;
  byteLength: number;
  durationMs?: number;
}
```

### Decision 3: 编码逻辑可单元测试

核心转换逻辑放在纯函数中：

- `mixToMono(channels)`
- `resampleLinear(input, inputSampleRate, outputSampleRate)`
- `encodePcm16(float32)`

AudioWorklet 与 browser lifecycle 只负责采集和发送，不承载复杂数学逻辑。

### Decision 4: 不保存 raw audio

PCM chunk 只在内存中短暂存在，用于 POST `/audio`。local history、badcase、prompt context 均不得保存 raw audio 或 base64 audio。

### Decision 5: Recovery 统一处理失败

失败映射：

- 麦克风权限失败 -> `microphone_permission_timeout` 或 safe error。
- AudioWorklet 初始化失败 -> fallback MediaRecorder。
- PCM 编码失败 -> `audio_encoding_failed`。
- audio route 发送失败 -> `audio_send_timeout` 或 safe error。
- no transcript after PCM input -> `no_transcript_after_audio`。

## Proposed Modules

- `src/lib/pcm-audio-capture/pcm.ts`
  - mono mixdown、linear resample、PCM16 encode。
- `src/lib/pcm-audio-capture/browser.ts`
  - browser support detection、capture lifecycle helpers。
- `src/lib/pcm-audio-capture/index.ts`
  - public exports。
- `src/app/pcm-capture-worklet.js`
  - AudioWorklet processor。

## Data Flow

```text
getUserMedia
  ↓
AudioContext + AudioWorklet
  ↓
Float32 frames
  ↓
mono mixdown + 16k resample + PCM16 encode
  ↓
POST /api/realtime-practice-sessions/:id/audio
  ↓
audio format adapter accepts audio/pcm;rate=16000
  ↓
Qwen provider sends input_audio_buffer.append
  ↓
SSE normalized transcript events update UI
```

## Error Handling

- Browser support check fails: show Chinese safe fallback message。
- Permission denied or timeout: stop capture, release tracks, fallback text。
- Empty PCM chunk: reject before POST。
- Audio send failure: stop capture, show safe message, keep existing transcript history。
- SSE still handles provider events independently; capture failure must not close an already active session unless user cancels。

## Safety

- API key remains server-only。
- AudioWorklet and browser helpers must not receive provider secrets。
- Errors must not include raw PCM bytes or base64 audio。
- Badcase mapping stores only safe recovery signal。

## Risks / Trade-offs

- [Risk] AudioWorklet support differs across browsers → Mitigation: support detection + fallback。
- [Risk] Resampling quality is basic → Mitigation: linear resampling is acceptable for MVP speech input; can upgrade later。
- [Risk] Chunk timing affects latency → Mitigation: use bounded chunk interval and test byte sizes。
- [Risk] Real Qwen behavior may still depend on session VAD timing → Mitigation: keep no transcript recovery and future manual commit change.

## Migration Plan

No data migration is required.

Implementation order:

1. PCM pure helpers with tests。
2. Browser support and metadata helpers。
3. AudioWorklet processor。
4. UI capture lifecycle integration。
5. Route/provider compatibility verification。
6. Recovery and fallback tests。
