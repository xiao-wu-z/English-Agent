## 1. Audio Format Schema

- [x] 1.1 创建 `src/lib/voice-audio-format/schema.ts`，定义 `AudioChunkMetadata` schema 和 TypeScript 类型。
- [x] 1.2 定义 error codes：`unsupported_audio_format`、`audio_encoding_failed`、`audio_metadata_missing`。
- [x] 1.3 校验 required fields：mimeType、sequence、byteLength。

## 2. Browser MIME Detection

- [x] 2.1 创建 `src/lib/voice-audio-format/browser.ts`。
- [x] 2.2 定义 preferred MIME types：`audio/webm;codecs=opus`、`audio/ogg;codecs=opus`、`audio/mp4`。
- [x] 2.3 实现 `selectSupportedMediaRecorderMimeType(isTypeSupported)`。
- [x] 2.4 无支持类型时返回 safe fallback result。

## 3. Server Adapter

- [x] 3.1 创建 `src/lib/voice-audio-format/adapter.ts`。
- [x] 3.2 实现 `validateAudioChunkMetadata`。
- [x] 3.3 实现 `decideAudioForwarding(metadata, acceptedMimeTypes)`。
- [x] 3.4 compatible 时返回 direct forward。
- [x] 3.5 incompatible 时返回 `unsupported_audio_format`。
- [x] 3.6 byteLength 为 0 时拒绝。

## 4. Integration Points

- [x] 4.1 更新 realtime audio route 设计，要求 audio chunk metadata。
- [x] 4.2 unsupported format 映射到 voice recovery `fallback_text`。
- [x] 4.3 确认 local history 和 badcase 不保存 raw audio。
- [x] 4.4 保留未来 AudioWorklet / PCM16 strategy 扩展口。

## 5. Tests

- [x] 5.1 测试 preferred MIME type 顺序选择。
- [x] 5.2 测试无 MIME 支持时 fallback。
- [x] 5.3 测试 metadata 缺失字段返回 `audio_metadata_missing`。
- [x] 5.4 测试 unsupported MIME 返回 `unsupported_audio_format`。
- [x] 5.5 测试 byteLength 0 被拒绝。
- [x] 5.6 测试错误对象不包含 raw audio 或 secrets。

## 6. Verification

- [x] 6.1 运行 `npm test`。
- [x] 6.2 运行 `npm run lint`。
- [x] 6.3 运行 `npm run build`。
- [x] 6.4 运行 `openspec status --change add-voice-audio-format-adapter`。
