## Context

真实语音链路包含浏览器、Next routes、Qwen WebSocket、SSE 和 UI 多个环节。端到端问题往往不是单个模块错误，而是 metadata、chunk timing、session id、provider env 或 SSE 状态不一致。

## Goals / Non-Goals

**Goals:**

- 建立一套可重复执行的语音 E2E 验证流程。
- 在 UI 或 debug route 展示 safe diagnostics。
- 验证真实麦克风输入能触发 Qwen transcript。
- 验证 assistant transcript 能通过 SSE 展示。
- 验证 session end 能关闭 provider session。

**Non-Goals:**

- 不自动录制或保存用户语音。
- 不引入 Playwright 真实麦克风虚拟设备。
- 不做生产级 tracing 平台。

## Decisions

### Decision 1: 先做 safe diagnostics，不做重型 observability

诊断信息只包含：

- session id
- provider name
- model name
- selected audio format
- SSE status
- last event type
- recovery reason

不得包含 raw audio、base64 audio、API key、Authorization header。

### Decision 2: 手动验证 checklist 是 MVP 验收的一部分

真实麦克风和 Qwen 免费额度环境不适合完全自动化。当前先落地可重复手动 checklist，并用单元测试覆盖诊断对象的安全性。

## Proposed Modules

- `src/lib/voice-e2e-validation/schema.ts`
- `src/lib/voice-e2e-validation/checklist.ts`
- `src/lib/voice-e2e-validation/index.ts`

## Validation Flow

```text
Start dev server
  ↓
Open voice mode
  ↓
Start Qwen session
  ↓
Start PCM capture
  ↓
Speak one sentence
  ↓
Observe user transcript
  ↓
Observe assistant transcript
  ↓
End session
  ↓
Confirm safe diagnostics
```
