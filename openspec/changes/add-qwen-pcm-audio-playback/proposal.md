## Why

Qwen realtime 输出音频为 24 kHz PCM。当前系统能归一化 `response.audio.delta` 为 playback queue，但前端还没有真正播放 PCM audio。为了让语音陪练更像真实口语对话，需要把 Qwen assistant audio delta 播放出来，同时保留 transcript-only fallback。

## What

- 新增 24 kHz PCM playback helper。
- 将 base64 PCM delta 解码为 PCM samples。
- 使用 Web Audio API 播放 assistant audio。
- 支持播放队列。
- 播放失败时继续展示 assistant transcript。
- 不保存输出音频。

## Impact

- 提升语音 Demo 体验。
- 不影响 Qwen 输入 PCM capture。
- 不引入音频文件持久化。
