## Context

`connect-qwen-realtime-websocket` 负责把 browser audio chunks 转发给 Qwen WebSocket。但 browser 侧音频格式并不稳定，不同浏览器对 MediaRecorder MIME type 支持不同。Qwen realtime 对音频输入格式也可能有明确要求。

本 change 不做转码，而是先把格式检测、metadata、server adapter 和 fallback 边界规范下来。

## Goals / Non-Goals

**Goals:**

- 定义 audio chunk metadata。
- 定义 preferred MediaRecorder MIME types。
- 检测浏览器支持的 MIME type。
- 定义 server-side audio format adapter。
- 支持 direct forwarding when provider accepts browser MIME type。
- 不支持时返回 `unsupported_audio_format`。
- 触发 fallback to text mode。
- 为后续 AudioWorklet / PCM16 留接口。

**Non-Goals:**

- 不做 ffmpeg 转码。
- 不做复杂实时降噪。
- 不做 VAD。
- 不实现 AudioWorklet PCM16。
- 不保存音频文件。
- 不做跨浏览器深度兼容矩阵。
- 不做音频质量评分。

## Decisions

### Decision 1: Preferred MIME types 固定顺序

优先尝试：

```text
audio/webm;codecs=opus
audio/ogg;codecs=opus
audio/mp4
```

浏览器端按顺序检测 `MediaRecorder.isTypeSupported(mimeType)`，选择第一个支持的格式。

### Decision 2: 每个 chunk 携带 metadata

Metadata:

```ts
type AudioChunkMetadata = {
  mimeType: string;
  sequence: number;
  durationMs?: number;
  sampleRate?: number;
  channels?: number;
  byteLength: number;
}
```

`sequence` 用于 server 检查 chunk 顺序，`byteLength` 用于拒绝空 chunk。

### Decision 3: Server adapter 不做转码

Server adapter 只做：

- validate metadata。
- validate non-empty chunk。
- check provider accepted formats。
- direct forward if compatible。
- reject with `unsupported_audio_format` if incompatible。

如果 Qwen 要求 PCM16 且 browser MIME 不兼容，本 change 不引入 ffmpeg 或 AudioWorklet，而是明确 fallback。

### Decision 4: Unsupported format 进入 recovery flow

当 server 返回 `unsupported_audio_format`：

- voice recovery health 应进入 `fallback_text`。
- UI 展示中文安全提示。
- 不保存 raw audio。
- 可记录 safe badcase signal。

### Decision 5: 为后续 PCM16 预留接口

后续可以新增：

```text
add-audioworklet-pcm16-capture
```

或：

```text
add-server-audio-transcoding
```

当前 adapter 的接口应允许未来新增 transform strategy，但 V1 不实现。

## Proposed Modules

- `src/lib/voice-audio-format/schema.ts`
  - audio chunk metadata schema、format error schema。
- `src/lib/voice-audio-format/browser.ts`
  - preferred MIME list、browser MIME detection helper。
- `src/lib/voice-audio-format/adapter.ts`
  - server-side compatibility check and direct forwarding decision。
- `src/lib/voice-audio-format/index.ts`
  - public exports。

## Data Flow

```text
Browser checks supported MIME
        ↓
MediaRecorder starts with selected MIME
        ↓
Audio chunk + metadata
        ↓
POST /audio
        ↓
Server audio format adapter
        ↓
compatible -> forward to Qwen
incompatible -> unsupported_audio_format -> fallback_text
```

## Error Handling

Error codes:

```text
unsupported_audio_format
audio_encoding_failed
audio_metadata_missing
```

Rules:

- Missing metadata: `audio_metadata_missing`。
- Empty chunk: existing `audio_chunk_invalid` or format-specific validation error。
- Unsupported MIME: `unsupported_audio_format`。
- Browser encoding failure: `audio_encoding_failed`。

## Safety

- Audio chunks are not persisted。
- Metadata must not include API key or provider secret。
- Unsupported format errors must not include raw audio。
- Badcase mapping must include safe summary only。

## Risks / Trade-offs

- [Risk] Qwen may not accept MediaRecorder default formats → Mitigation: explicit unsupported format error and fallback to text.
- [Risk] Browser MIME support differs → Mitigation: deterministic preferred MIME detection helper.
- [Risk] No transcoding means some browsers cannot use voice mode → Mitigation: follow-up AudioWorklet/PCM16 change.
- [Risk] Metadata lies or is incomplete → Mitigation: server validates required metadata and byte length.

## Migration Plan

No migration is required.

Implementation order:

1. Define metadata schema and error codes。
2. Implement browser MIME detection helper。
3. Implement server adapter compatibility check。
4. Integrate adapter into audio upload route。
5. Add tests for MIME selection、metadata validation、unsupported format、fallback mapping。

## Open Questions

- Exact Qwen accepted input formats must be confirmed during `connect-qwen-realtime-websocket` implementation.
- If Qwen requires PCM16, whether to implement AudioWorklet capture or server-side transcoding first. Current recommendation: AudioWorklet PCM16 follow-up.
