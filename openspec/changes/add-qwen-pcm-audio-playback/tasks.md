## 1. PCM Playback Helpers

- [x] 1.1 创建 `src/lib/qwen-pcm-playback/pcm.ts`。
- [x] 1.2 实现 base64 -> Uint8Array。
- [x] 1.3 实现 Int16 PCM -> Float32。
- [x] 1.4 固定 Qwen output sampleRate=24000。

## 2. Browser Playback Queue

- [x] 2.1 创建 `src/lib/qwen-pcm-playback/browser.ts`。
- [x] 2.2 使用 AudioContext 创建 AudioBuffer。
- [x] 2.3 顺序播放 audio delta。
- [x] 2.4 播放失败时返回 transcript-only fallback 状态。
- [x] 2.5 stop/cancel 时清空队列。

## 3. UI Integration

- [x] 3.1 voice UI 消费 `audio.delta`。
- [x] 3.2 播放队列状态展示。
- [x] 3.3 播放失败时显示中文 safe message。
- [x] 3.4 transcript 展示不依赖 audio playback。

## 4. Tests

- [x] 4.1 测试 base64 decode。
- [x] 4.2 测试 PCM16 -> Float32。
- [x] 4.3 测试 queue 顺序。
- [x] 4.4 测试 playback failure fallback。
- [x] 4.5 测试不保存 raw audio。

## 5. Verification

- [x] 5.1 运行 `npm test`。
- [x] 5.2 运行 `npm run lint`。
- [x] 5.3 运行 `npm run build`。
- [x] 5.4 运行 `openspec status --change add-qwen-pcm-audio-playback`。
