## 1. PCM Encoding Helpers

- [x] 1.1 创建 `src/lib/pcm-audio-capture/pcm.ts`。
- [x] 1.2 实现 Float32 clamp 到 [-1, 1]。
- [x] 1.3 实现 Float32 -> Int16 PCM little-endian 编码。
- [x] 1.4 实现多声道 mixdown 到 mono。
- [x] 1.5 实现 linear resample 到 16000 Hz。
- [x] 1.6 确保 helper 不依赖 browser runtime，便于 node:test。

## 2. Browser Capture Support

- [x] 2.1 创建 `src/lib/pcm-audio-capture/browser.ts`。
- [x] 2.2 检测 `navigator.mediaDevices.getUserMedia`。
- [x] 2.3 检测 `AudioContext` 和 `audioWorklet`。
- [x] 2.4 定义 PCM capture support result。
- [x] 2.5 不支持时返回中文 safe fallback message。

## 3. AudioWorklet Processor

- [x] 3.1 新增 `src/app/pcm-capture-worklet.js` 或等价 public worklet asset。
- [x] 3.2 从 input channel 读取 Float32 frames。
- [x] 3.3 将 frames 通过 `port.postMessage` 发回主线程。
- [x] 3.4 processor 不读取 API key、不保存 audio。

## 4. Frontend Voice UI Integration

- [x] 4.1 语音模式优先启动 PCM capture。
- [x] 4.2 将 Float32 frames 转为 PCM16 16k mono chunk。
- [x] 4.3 使用 metadata `audio/pcm;rate=16000`、sampleRate=16000、channels=1。
- [x] 4.4 POST PCM chunk 到 `/api/realtime-practice-sessions/:id/audio`。
- [x] 4.5 停止录音时关闭 AudioContext、AudioWorklet node 和 MediaStream tracks。
- [x] 4.6 PCM capture 不可用时 fallback 到 MediaRecorder。
- [x] 4.7 失败时展示中文 safe message 并可继续文本练习。

## 5. Server Compatibility

- [x] 5.1 确认 audio format adapter 接受 `audio/pcm;rate=16000`。
- [x] 5.2 确认 Qwen provider 收到 PCM bytes 后发送 `input_audio_buffer.append`。
- [x] 5.3 确认 route responses 不包含 raw audio、API key、Authorization header。
- [x] 5.4 不保存 raw audio 到 local history 或 badcase。

## 6. Recovery Integration

- [x] 6.1 PCM capture 初始化失败映射到 fallback message。
- [x] 6.2 PCM 编码失败映射到 `audio_encoding_failed`。
- [x] 6.3 audio send failure 映射到 existing voice recovery。
- [x] 6.4 no transcript after PCM input 映射到 `no_transcript_after_audio`。
- [x] 6.5 recovery badcase 只记录 safe signal。

## 7. Tests

- [x] 7.1 测试 Float32 -> PCM16 编码边界值。
- [x] 7.2 测试 stereo -> mono mixdown。
- [x] 7.3 测试 resample 输出长度和基本波形方向。
- [x] 7.4 测试 PCM metadata 生成。
- [x] 7.5 测试 browser support fallback。
- [x] 7.6 测试 audio route 接受 PCM metadata。
- [x] 7.7 测试 raw audio 和 secrets 不进入 errors/history/badcase。

## 8. Verification

- [x] 8.1 运行 `npm test`。
- [x] 8.2 运行 `npm run lint`。
- [x] 8.3 运行 `npm run build`。
- [x] 8.4 运行 `openspec status --change add-audioworklet-pcm16-capture`。
