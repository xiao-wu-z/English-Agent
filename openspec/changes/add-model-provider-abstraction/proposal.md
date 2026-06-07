## Why

English-Agent 后续会优先用通义 / 百炼的免费额度做 Demo，但业务层不能直接绑定某个模型供应商。需要先建立模型 Provider 抽象，让 Agent Skill Runtime 产出的 `SkillRunRequest` 可以被 Qwen、mock 以及未来 OpenAI-compatible providers 统一执行。

本变更把模型调用隔离到 server-only provider adapter，支持多模型扩展、结构化 JSON 输出校验和清晰错误处理，避免后续在 UI、Skill、Scenario 或 Prompt Builder 中散落 provider 细节。

## What Changes

- 新增 model provider 抽象：
  - `TextModelProvider`
  - `RealtimeModelProvider` 接口占位
  - provider registry
  - provider config
- 新增 OpenAI-compatible text provider 基类，支持通义、OpenAI、Kimi、DeepSeek、MiniMax 等兼容 `/chat/completions` 的供应商扩展。
- 新增 Qwen text provider：
  - 默认 base URL：`https://dashscope.aliyuncs.com/compatible-mode/v1`
  - API key 从 `QWEN_API_KEY` 或 `DASHSCOPE_API_KEY` 读取
  - 默认模型从 `QWEN_TEXT_MODEL` 读取，缺省为 `qwen-plus`
- 新增 mock text provider，用于本地开发、CI 和无 API key 测试。
- 新增结构化输出流程：
  - 接收 `SkillRunRequest`
  - 调用 provider
  - 提取 JSON
  - 使用对应 Zod schema 校验
  - 返回 typed result
- 新增 provider error 类型，覆盖 missing api key、http error、invalid json、schema validation failed、provider unavailable。
- 默认 provider 为 `mock`；只有显式设置 `MODEL_PROVIDER=qwen` 才使用通义。
- 本变更不实现 realtime provider，不实现 WebRTC/WebSocket，不实现 UI，不写业务 API route。

## Capabilities

### New Capabilities

- `model-provider-abstraction`: 定义多模型 provider 抽象、OpenAI-compatible text provider、Qwen text provider、mock provider、provider registry 和结构化输出校验。

### Modified Capabilities

- 无。

## Impact

- 新增 `src/lib/model-providers/` server-side 模块。
- 后续 `add-agent-skill-runtime` 产出的 `SkillRunRequest` 将通过 provider adapter 执行。
- 后续 assessment、correction、summary API 可复用同一个 text provider 调用链。
- 后续 Qwen Omni / DashScope WebSocket realtime provider 可以在同一抽象下扩展，但不在本变更实现。
- API key 和 provider secret 只在 server-only provider 模块读取，不进入前端 bundle。
