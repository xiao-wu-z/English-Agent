## Context

English-Agent 后续 Demo 希望优先使用通义 / 百炼的免费额度，但前面的 Scenario、Agent Skills、Prompt Runtime 都应该保持 provider-neutral。模型调用需要单独抽象，否则后续 assessment、correction、summary、realtime 会在不同位置重复实现通义或 OpenAI 调用。

`ai-tuoke-mt-agent` 里的可取做法是：用 OpenAI-compatible 公共调用层复用不同供应商；provider 通过环境变量配置；开发环境提供 echo/mock；HTTP 调用避免本机代理副作用；错误统一包装。我们采用这些思路，但只实现 English-Agent V1 需要的轻量 text provider。

## Goals / Non-Goals

**Goals:**

- 定义多模型 provider 抽象。
- 实现 text provider registry。
- 实现 OpenAI-compatible text provider 基类。
- 实现 Qwen text provider。
- 实现 mock text provider。
- 支持从 `SkillRunRequest` 执行结构化 JSON 输出。
- 使用 Zod 校验 provider 输出。
- 保证 API key 和 provider secret 只在 server-only 模块读取。
- 为后续 realtime provider 预留接口。

**Non-Goals:**

- 不实现 Qwen Omni realtime。
- 不实现 WebRTC、WebSocket 或音频流。
- 不实现 UI。
- 不实现业务 API route。
- 不实现 provider 自动路由或负载均衡。
- 不实现 badcase log。

## Decisions

### Decision 1: 默认 provider 为 mock

默认使用 `mock`，只有 `MODEL_PROVIDER=qwen` 时才启用通义。

替代方案是检测到 `QWEN_API_KEY` 就自动切换 Qwen。这个做法会让本地、CI 和部署环境因为环境变量差异产生不同结果，不利于稳定验证。

### Decision 2: OpenAI-compatible 基类复用多供应商

通义百炼、OpenAI、Kimi、DeepSeek、MiniMax 等都可以走类似 `/chat/completions` 结构。我们先实现一个 `OpenAICompatibleTextProvider`，Qwen 只是配置它的 base URL、model 和 key。

```ts
new OpenAICompatibleTextProvider({
  name: "qwen",
  baseUrl,
  apiKey,
  model,
});
```

后续新增模型供应商只需要注册新的 provider config。

### Decision 3: Provider 只接收 `SkillRunRequest`

Provider 不读取 Scenario、不读取 Skill markdown、不知道三层 prompt 细节。它只消费 runtime 产物：

```ts
{
  messages;
  expectedOutputSchema;
}
```

这样模型调用层不会反向依赖业务配置。

### Decision 4: 输出必须先 parse JSON 再 Zod 校验

模型输出进入应用前必须：

1. 获取 raw text。
2. 容错提取 JSON object。
3. 根据 expected output schema 选择 Zod schema。
4. parse 并 strict validate。
5. 返回 typed result。

如果 JSON 无法解析或 schema 不匹配，返回统一 provider error。已有 agent skill contracts 使用 strict object，可以拒绝隐藏推理字段。

### Decision 5: Provider 实现放在 server-only 模块

读取 API key 的代码必须放在 server-only 文件，例如：

```text
src/lib/model-providers/server/
```

前端组件不得导入这些模块。客户端只能通过后续 API route 间接调用。

### Decision 6: Realtime 只定义接口

Qwen Omni / DashScope WebSocket 的实时语音链路需要单独设计，包含会话生命周期、音频帧、字幕、断线重连等复杂度。本 change 只定义接口边界，后续 `add-qwen-realtime-voice-provider` 再实现。

## Proposed Modules

- `src/lib/model-providers/types.ts`
  - `ModelProviderName`
  - `TextGenerationRequest`
  - `TextGenerationResult`
  - `TextModelProvider`
  - `RealtimeModelProvider`
  - `ModelProviderError`
- `src/lib/model-providers/schemas.ts`
  - expected output schema resolver，映射 agent skill contract schemas。
- `src/lib/model-providers/json.ts`
  - raw text JSON extraction and parse helpers。
- `src/lib/model-providers/server/openai-compatible.ts`
  - reusable OpenAI-compatible HTTP provider。
- `src/lib/model-providers/server/qwen.ts`
  - Qwen provider factory。
- `src/lib/model-providers/server/mock.ts`
  - mock fixtures for all expected output schemas。
- `src/lib/model-providers/server/registry.ts`
  - resolve provider by `MODEL_PROVIDER`。
- `src/lib/model-providers/index.ts`
  - export safe types only, not server secret readers.

## Data Flow

```text
SkillRunRequest
        ↓
resolveTextProvider(MODEL_PROVIDER)
        ↓
provider.generateJson(request)
        ↓
raw model text
        ↓
extractJsonObject
        ↓
schemaForExpectedOutput
        ↓
Zod strict validation
        ↓
TextGenerationResult<T>
```

## Error Handling

Provider errors use stable codes:

- `missing_api_key`
- `http_error`
- `invalid_json`
- `schema_validation_failed`
- `provider_unavailable`
- `unsupported_provider`

Errors must include provider name and safe message. They must not include API key, Authorization header, full request headers, or secret environment values.

## Configuration

```text
MODEL_PROVIDER=mock | qwen
QWEN_API_KEY=<server-only>
DASHSCOPE_API_KEY=<server-only fallback>
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_TEXT_MODEL=qwen-plus
```

HTTP provider should use `fetch` with explicit timeout support where practical. If implementation uses a client abstraction, it should avoid inheriting local proxy behavior that can break development, matching the lesson from `ai-tuoke-mt-agent`.

## Risks / Trade-offs

- [Risk] OpenAI-compatible providers differ in small response details → Mitigation: isolate parsing in provider class and keep Qwen tests around response fixtures.
- [Risk] Mock provider hides real provider failures → Mitigation: Qwen is explicit via `MODEL_PROVIDER=qwen`; integration tests can target Qwen separately when credentials are available.
- [Risk] JSON extraction from model text can accept extra prose → Mitigation: extract only the first JSON object, then strict Zod validation; invalid or extra fields fail.
- [Risk] Server-only code leaks into client bundle → Mitigation: keep secret-reading files under `server/` and do not export them from client-safe entrypoints.

## Migration Plan

This is a new capability and requires no data migration.

Implementation order:

1. Define provider types and error class.
2. Define expected output schema resolver.
3. Implement JSON extraction and validation helpers.
4. Implement mock provider.
5. Implement OpenAI-compatible provider.
6. Implement Qwen provider factory.
7. Implement provider registry.
8. Add tests for mock, JSON validation, Qwen config, missing key, unknown provider, and secret safety.

## Open Questions

- Whether Qwen text provider should support streaming in the same class. Current recommendation: keep first version non-streaming JSON generation only.
- Whether provider fallback should exist. Current recommendation: no automatic fallback unless explicitly configured in a later change.
