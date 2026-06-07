## Why

当前 Qwen realtime WebSocket、SSE、音频格式适配和恢复策略已经具备基础链路，但浏览器语音输入仍不能稳定直连 Qwen。官方 Qwen realtime 客户端事件文档要求输入音频格式为 `pcm`，且输入音频要求为 16 kHz 采样率 PCM 音频流。

浏览器 `MediaRecorder` 常见输出是 `audio/webm;codecs=opus`、`audio/ogg;codecs=opus` 或 `audio/mp4`，不能直接作为 Qwen `input_audio_buffer.append` 的音频内容。若继续依赖 MediaRecorder，真实 Qwen 会话会连接成功但无法稳定产出 transcript，只能 fallback。

因此下一步需要在浏览器端实现 PCM16 mono 16k 采集与编码，让麦克风输入真正进入现有 Qwen realtime provider。

## What

- 新增 browser PCM capture capability。
- 使用 `navigator.mediaDevices.getUserMedia` 获取麦克风音频。
- 使用 `AudioContext` / `AudioWorklet` 采集 Float32 PCM。
- 将 Float32 PCM 转为 mono PCM16。
- 将音频重采样为 16 kHz。
- 通过现有 `/api/realtime-practice-sessions/:id/audio` route 发送 PCM chunk。
- metadata 使用 `mimeType=audio/pcm;rate=16000`。
- 沿用现有 Qwen WebSocket provider 的 `input_audio_buffer.append`。
- 保留 MediaRecorder fallback 和文本 fallback。
- 采集失败、编码失败、发送失败时接入现有 voice recovery。

## Impact

- 扩展 `realtime-voice-practice-ui`，从 MediaRecorder mock-friendly 输入升级到 Qwen-compatible PCM 输入。
- 扩展 `voice-audio-format-adapter`，把 `audio/pcm;rate=16000` 作为 browser PCM capture 的首选直连格式。
- 不引入 ffmpeg。
- 不保存原始音频。
- 不暴露 API key、Authorization header、provider secret 或 raw audio。
