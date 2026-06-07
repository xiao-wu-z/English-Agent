## Why

English-Agent 已经具备文本版练习闭环，下一步需要为语音陪练接入通义实时多模态模型做 provider 层准备。用户指定后续多模态模型使用 `qwen3.5-omni-plus-realtime`，但真实 API key 必须只放本地环境变量，不能进入代码、OpenSpec、prompt、本地历史或日志。

直接做完整语音 UI 会同时引入麦克风权限、音频编码、播放、实时字幕、断线重连和模型连接等复杂度。本 change 先定义 Qwen realtime voice provider 的接口、事件、配置和安全边界，为后续 `add-realtime-voice-practice-ui` 铺路。

## What

- 定义 realtime model provider 接口。
- 定义 Qwen realtime provider 配置。
- 定义 mock realtime provider。
- 定义 realtime session schema。
- 定义 realtime provider event schema。
- 定义 realtime provider error codes。
- 定义 server-only secret 读取规则。
- 定义安全边界：不暴露 API key、不写入 prompt/history/log。
- 明确默认 provider 仍是 mock，显式 `MODEL_PROVIDER=qwen` 才启用真实 Qwen provider。

## Impact

- 新增 `qwen-realtime-voice-provider` capability。
- 扩展现有 model provider 抽象，增加 realtime provider 分支。
- 后续 realtime voice UI 可消费统一事件流。
- 不新增语音 UI、不保存原始音频、不提交真实 API key。
