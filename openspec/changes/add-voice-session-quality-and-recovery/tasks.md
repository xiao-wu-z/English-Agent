## 1. Recovery Schemas

- [x] 1.1 创建 `src/lib/realtime-voice-recovery/schema.ts`，定义 health state、timeout type、recovery action、recovery event schema 和 TypeScript 类型。
- [x] 1.2 确保 recovery event 不允许 API key、Authorization header、provider secret、raw audio 字段。

## 2. Timeout Policy

- [x] 2.1 创建 `src/lib/realtime-voice-recovery/policy.ts`，定义默认 timeout 阈值。
- [x] 2.2 默认 `microphone_permission_timeout=15000`。
- [x] 2.3 默认 `qwen_connect_timeout=15000`。
- [x] 2.4 默认 `no_user_speech_timeout=20000`。
- [x] 2.5 默认 `no_assistant_response_timeout=30000`。
- [x] 2.6 默认 `sse_idle_timeout=45000`。
- [x] 2.7 默认 `audio_send_timeout=10000`。
- [x] 2.8 默认 `summary_timeout=30000`。

## 3. Recovery Decisions

- [x] 3.1 创建 `src/lib/realtime-voice-recovery/decision.ts`。
- [x] 3.2 首次 SSE disconnect -> `restart_sse`。
- [x] 3.3 重复 SSE disconnect -> `fallback_to_text`。
- [x] 3.4 首次 Qwen connect failure -> `retry_connect`。
- [x] 3.5 重复 Qwen connect failure -> `fallback_to_text` 或 `mark_session_failed`。
- [x] 3.6 no transcript after audio input -> `fallback_to_text`。
- [x] 3.7 assistant response timeout -> `show_safe_error` + `fallback_to_text`。

## 4. Safe Messages

- [x] 4.1 创建 `src/lib/realtime-voice-recovery/messages.ts`。
- [x] 4.2 为 microphone timeout、Qwen connect timeout、SSE disconnect、no transcript、assistant timeout、summary timeout 提供中文安全提示。
- [x] 4.3 确认提示不包含 provider secret、API key 或 raw config。

## 5. Badcase Mapping

- [x] 5.1 定义 voice recovery badcase attribution helper。
- [x] 5.2 Qwen connection failed、repeated SSE disconnect、no transcript、event parse failure、assistant timeout、fallback to text、summary failed 均可映射为 safe badcase signal。
- [x] 5.3 badcase inputSnapshot 只包含安全摘要，不包含 raw audio 或 secrets。

## 6. Tests

- [x] 6.1 测试 health state、timeout type、recovery action schema。
- [x] 6.2 测试 timeout policy 默认值。
- [x] 6.3 测试 recovery decision mapping。
- [x] 6.4 测试 safe user messages 不包含 secrets。
- [x] 6.5 测试 badcase mapping 不包含 raw audio、API key、Authorization header。

## 7. Verification

- [x] 7.1 运行 `npm test`。
- [x] 7.2 运行 `npm run lint`。
- [x] 7.3 运行 `npm run build`。
- [x] 7.4 运行 `openspec status --change add-voice-session-quality-and-recovery`。
