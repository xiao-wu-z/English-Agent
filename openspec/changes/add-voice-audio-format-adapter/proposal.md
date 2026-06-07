## Why

真实语音链路打通前，还有一个关键风险：浏览器 `MediaRecorder` 输出的音频格式不一定能被 Qwen realtime 直接识别。常见浏览器输出可能是 `audio/webm;codecs=opus`、`audio/ogg;codecs=opus` 或 `audio/mp4`，而实时语音模型可能要求 PCM16、固定采样率或特定 base64 audio frame。

如果不单独定义音频格式适配边界，就可能出现 WebSocket 已连接但模型没有 transcript、事件解析失败或不同浏览器行为不一致的问题。

## What

- 定义 browser audio input format contract。
- 检测浏览器支持的 MediaRecorder MIME type。
- 定义 `AudioChunkMetadata`。
- 定义 server-side audio adapter。
- 定义 unsupported format 错误。
- 定义 fallback to text mode。
- 为后续 AudioWorklet / PCM16 / transcoding 预留接口。

## Impact

- 新增 `voice-audio-format-adapter` capability。
- 作为 `connect-qwen-realtime-websocket` 的音频兼容性补充。
- 不引入 ffmpeg，不做复杂转码，不保存音频文件。
