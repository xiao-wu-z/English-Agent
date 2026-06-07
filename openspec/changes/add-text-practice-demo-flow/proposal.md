## Why

English-Agent 已经规划了场景、Agent Skill、会话、Prompt Builder、ReAct、Provider 和本地历史，但还缺少一条 MVP 可以先跑通的主链路。直接从实时语音和多模态模型开始会把 ASR、TTS、WebRTC/WebSocket、音频状态和模型接入全部耦合在一起，风险过高。

先实现 Next.js 文本版练习 Demo，可以在不依赖麦克风、不依赖通义 API key 的情况下验证核心业务链路：选择场景、创建 session、文本对话、轻纠错决策、结束总结、本地历史保存。后续再把文本输入替换为语音转写，并接入 Qwen realtime voice provider。

## What

- 定义 Next.js 文本练习 Demo flow。
- 定义最小 Next 页面范围：场景选择、对话区、文本输入、轻纠错、结束按钮、总结区。
- 定义 Route Handlers：
  - `POST /api/practice-sessions`
  - `POST /api/practice-sessions/:id/turns`
  - `POST /api/practice-sessions/:id/end`
  - `GET /api/practice-sessions/:id`
- 默认使用 mock provider，不需要通义 API key。
- 每轮按 practice -> correction candidate -> quality gate / ReAct decision -> append turn 返回。
- 结束时按 final assessment -> correction aggregation -> summary -> completed -> local history save 返回。
- 明确不接麦克风、ASR、TTS、Realtime WebRTC/WebSocket、Qwen realtime。

## Impact

- 新增 `text-practice-demo-flow` capability。
- 作为 MVP 第一条可运行闭环的实现规格。
- 后续 `add-qwen-realtime-voice-provider` 可在此链路基础上替换输入/输出通道。
- 不写入真实 API key；真实 key 只允许放在被 `.gitignore` 忽略的本地 `.env.local`。
