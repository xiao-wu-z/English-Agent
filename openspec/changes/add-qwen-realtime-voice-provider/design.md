## Context

文本版 MVP 已经跑通，但最终产品形态是英语语音陪练。通义的 realtime 多模态模型适合作为 Demo 的语音 provider，因为可以处理实时音频、文本和响应事件。这个 change 只处理 provider 层：如何创建 realtime session、如何发送文本/音频、如何结束会话、如何接收事件、如何处理错误和密钥安全。

现有 `add-model-provider-abstraction` 已经定义了 text provider 和 realtime provider placeholder。本 change 是对 realtime provider placeholder 的细化和落地规格。

## Goals / Non-Goals

**Goals:**

- 定义 `RealtimeModelProvider` 接口。
- 定义 Qwen realtime provider factory。
- 默认模型为 `qwen3.5-omni-plus-realtime`。
- 支持 `DASHSCOPE_API_KEY` 和 `QWEN_API_KEY` server-only 配置。
- 定义 mock realtime provider，便于本地和测试无 key 运行。
- 定义 realtime session schema。
- 定义 realtime provider event schema。
- 定义 error codes 和 secret-safe errors。
- 明确 provider event 可以供后续 UI 和 practice session orchestration 消费。

**Non-Goals:**

- 不实现完整语音 UI。
- 不实现麦克风权限流程。
- 不实现音频播放控件。
- 不实现复杂断线重连。
- 不保存原始音频。
- 不实现 ASR/TTS 独立服务。
- 不实现完整 WebRTC/WebSocket 产品化体验。
- 不把真实 API key 写入仓库。
- 不改变文本 Demo 默认 mock provider。

## Decisions

### Decision 1: 默认 provider 仍然是 mock

默认配置：

```text
MODEL_PROVIDER=mock
```

只有显式配置：

```text
MODEL_PROVIDER=qwen
```

才尝试创建真实 Qwen realtime provider。这样本地、CI 和 Demo 文本链路不会因为环境变量差异产生不稳定行为。

### Decision 2: Qwen realtime 使用独立模型配置

配置项：

```text
QWEN_REALTIME_MODEL=qwen3.5-omni-plus-realtime
DASHSCOPE_API_KEY=<server-only local env>
QWEN_API_KEY=<server-only local env fallback>
```

`QWEN_REALTIME_MODEL` 默认值为 `qwen3.5-omni-plus-realtime`。API key 只在 server-only provider factory 中读取，不得进入前端 bundle。

### Decision 3: Realtime provider 暴露统一接口

接口边界：

```ts
type RealtimeModelProvider = {
  name: string;
  modelName: string;
  createSession(input): Promise<RealtimeSession>;
  sendText(sessionId: string, text: string): Promise<void>;
  sendAudioChunk(sessionId: string, chunk: Uint8Array): Promise<void>;
  endSession(sessionId: string): Promise<void>;
  onEvent(sessionId: string, handler: (event) => void): () => void;
}
```

UI 和 session orchestration 不直接依赖 Qwen 内部事件格式，而是消费 normalized events。

### Decision 4: 事件统一归一化

事件类型：

```text
session.created
transcript.user.partial
transcript.user.final
transcript.assistant.partial
transcript.assistant.final
audio.delta
interruption
error
session.closed
```

事件必须包含 session id、event id、createdAt 和 type。文本 transcript 和 audio delta 都是可选 payload，不要求每个事件都有。

### Decision 5: Mock realtime provider 是一等实现

mock realtime provider 应支持：

- 创建 session。
- 接收 text input。
- 发出 user final transcript。
- 发出 assistant final transcript。
- 关闭 session。

它不需要生成真实音频，但可以发出 deterministic `audio.delta` placeholder，供 UI 测试事件流。

### Decision 6: Secret safety 优先

以下内容不得出现在 response、event、prompt、本地历史、badcase hint 或日志中：

- API key。
- Authorization header。
- provider secret。
- secret environment values。
- raw provider config。

错误对象必须只包含安全 code、provider name、session id 和安全 message。

## Proposed Modules

- `src/lib/model-providers/realtime-types.ts`
  - `RealtimeSession`
  - `RealtimeProviderEvent`
  - `RealtimeModelProvider`
  - `RealtimeProviderError`
- `src/lib/model-providers/server/realtime-mock.ts`
  - mock realtime provider。
- `src/lib/model-providers/server/qwen-realtime.ts`
  - Qwen realtime provider factory and config validation。
- `src/lib/model-providers/server/realtime-registry.ts`
  - `resolveRealtimeProvider(env)`。
- `src/lib/model-providers/realtime.test.ts`
  - schema、mock、registry、missing key、secret safety tests。

## Data Flow

```text
future voice UI / session orchestration
        ↓
resolveRealtimeProvider(MODEL_PROVIDER)
        ↓
createSession
        ↓
sendText / sendAudioChunk
        ↓
provider-specific event stream
        ↓
normalized RealtimeProviderEvent
        ↓
future practice session runtime / UI
```

## Error Handling

Realtime error codes:

```text
missing_api_key
session_create_failed
event_parse_failed
audio_chunk_invalid
connection_closed
timeout
unsupported_provider
```

Rules:

- Missing key when `MODEL_PROVIDER=qwen`: throw `missing_api_key`.
- Unknown provider: throw `unsupported_provider`.
- Invalid audio chunk: throw `audio_chunk_invalid`.
- Provider connection closed unexpectedly: emit or throw `connection_closed`.
- Event parse failure: emit safe error event and do not expose raw secret config.

## Security And Config

`.gitignore` already ignores `.env*`; real credentials belong only in local `.env.local`.

Example local configuration, without real key:

```text
MODEL_PROVIDER=qwen
QWEN_REALTIME_MODEL=qwen3.5-omni-plus-realtime
DASHSCOPE_API_KEY=<local secret>
```

OpenSpec, source code, tests and commit messages must not include real API keys.

## Risks / Trade-offs

- [Risk] Realtime transport details may differ across Qwen API versions → Mitigation: isolate provider-specific parsing in `qwen-realtime.ts`.
- [Risk] Mock provider hides true latency and event ordering → Mitigation: mock only validates app integration; Qwen integration gets explicit tests when credentials are available.
- [Risk] Secrets leak to client through careless exports → Mitigation: secret readers live only under `server/` and are not exported from client-safe entrypoints.
- [Risk] Voice UI pressure expands provider scope → Mitigation: this change stops at provider interface and normalized events.

## Migration Plan

No migration is required.

Implementation order:

1. Define realtime types and schemas.
2. Implement mock realtime provider.
3. Implement Qwen realtime provider config validation.
4. Implement realtime provider registry.
5. Add tests for default mock, explicit Qwen missing key, event normalization and secret safety.

## Open Questions

- Qwen realtime transport should be WebSocket or WebRTC for the first real implementation. Current recommendation: choose the official path that is simplest for browser voice UI in a follow-up change.
- Whether audio chunks should be PCM16, Opus, or browser-native encoded blobs. Current change only defines `Uint8Array` provider boundary; exact format belongs to realtime UI/transport implementation.
