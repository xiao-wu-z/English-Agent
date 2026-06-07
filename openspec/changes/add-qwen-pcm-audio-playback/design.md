## Context

Qwen realtime server events 中 `response.audio.delta` 的 `delta` 是 base64 编码音频数据，输出音频格式为 `pcm`，采样率为 24 kHz。前端需要把这些 delta 顺序播放。

## Goals / Non-Goals

**Goals:**

- 解码 base64 PCM。
- 将 Int16 PCM 转 Float32。
- 使用 AudioContext 播放 24k mono audio。
- 顺序消费 playback queue。
- 播放失败 fallback transcript-only。

**Non-Goals:**

- 不保存输出音频。
- 不做音色配置。
- 不做复杂打断播放策略。

## Decisions

### Decision 1: Transcript-first playback

assistant transcript 展示不依赖音频播放。音频播放失败只影响听觉体验，不阻断练习。

### Decision 2: Queue 顺序播放

audio delta 按 SSE 到达顺序进入队列，播放器按顺序消费，避免片段重叠。

## Proposed Modules

- `src/lib/qwen-pcm-playback/pcm.ts`
- `src/lib/qwen-pcm-playback/browser.ts`
- `src/lib/qwen-pcm-playback/index.ts`

## Data Flow

```text
SSE audio.delta
  ↓
base64 decode
  ↓
Int16 PCM -> Float32
  ↓
AudioBuffer(sampleRate=24000)
  ↓
AudioContext playback queue
```
