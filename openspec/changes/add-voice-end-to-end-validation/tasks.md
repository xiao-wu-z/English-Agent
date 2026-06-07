## 1. Validation Contract

- [x] 1.1 创建 `src/lib/voice-e2e-validation/schema.ts`。
- [x] 1.2 定义 safe diagnostics schema。
- [x] 1.3 定义 validation checklist item schema。
- [x] 1.4 禁止 diagnostics 包含 secret 或 raw audio。

## 2. Checklist

- [x] 2.1 创建 `src/lib/voice-e2e-validation/checklist.ts`。
- [x] 2.2 定义 start session 验证项。
- [x] 2.3 定义 PCM chunk 验证项。
- [x] 2.4 定义 Qwen transcript 验证项。
- [x] 2.5 定义 SSE UI 验证项。
- [x] 2.6 定义 end session 验证项。

## 3. UI / Debug Integration

- [x] 3.1 在语音 UI 展示 safe diagnostics。
- [x] 3.2 显示 provider、audio format、SSE status、last event。
- [x] 3.3 显示 fallback reason。
- [x] 3.4 不显示 API key、Authorization header、raw audio。

## 4. Tests

- [x] 4.1 测试 diagnostics schema。
- [x] 4.2 测试 checklist 完整性。
- [x] 4.3 测试 diagnostics secret safety。

## 5. Verification

- [x] 5.1 运行 `npm test`。
- [x] 5.2 运行 `npm run lint`。
- [x] 5.3 运行 `npm run build`。
- [x] 5.4 运行 `openspec status --change add-voice-end-to-end-validation`。
