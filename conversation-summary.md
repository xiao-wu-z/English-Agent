# English-Agent 对话历史摘要

日期：2026-06-07

## 用户偏好

- 后续尽量使用中文沟通。
- 开发流程遵循基于 `develop` 创建功能分支的方式。
- 当前功能分支为 `feat/englishAgent-V1`。
- 需求设计和实现尽量使用 OpenSpec 与 Superpowers。
- 用户希望先拆 MVP、小步商量 change，再按顺序实现。
- 真实 API key 不应写入仓库、OpenSpec、代码、提交信息或日志。

## 已完成的基础工作

- 已创建并推送过 `develop` 和 `feat/englishAgent-V1` 分支。
- 已完成并提交过 Agent Skill 合同：
  - `agent-skills/english-practice/SKILL.md`
  - `agent-skills/english-assessment/SKILL.md`
  - `agent-skills/english-correction/SKILL.md`
  - `agent-skills/english-summary/SKILL.md`
- 已新增 `src/lib/agent-skill-contracts/`，定义 practice、assessment、quality、correction、summary 等输出 schema。
- 已完善 `openspec/config.yaml`，明确项目目标、MVP 范围、技术栈、架构约定、UX 约定和 OpenSpec artifact rules。

## 核心产品架构共识

英语陪练产品采用以下分层：

```text
Scenario Catalog: 练什么
Agent Skills: 怎么练、怎么评、怎么纠错、怎么总结
Prompt Context Builder: 如何组合 T1/T2/T3
Model Provider Abstraction: 如何调用模型
Practice Session Flow: 如何推进一次练习
ReAct Orchestration: 如何评估、决策和降幻觉
Local History / Badcase Log: 如何沉淀历史和失败样本
```

三层 Prompt 架构：

```text
T1: Core Coach Rules
  - 基本角色
  - 红线
  - 不暴露 chain-of-thought
  - 不冒充官方评分
  - 不泄露 provider / secret

T2: Scenario + Active Skill
  - 当前场景
  - 当前单个 skill
  - 不全量注入所有 skills

T3: Runtime State
  - ConversationMemorySnapshot
  - recent turns
  - rolling summary
  - relevant badcase hints
  - current task input
```

## 已商量并落地的 OpenSpec changes

以下 changes 已经落成 OpenSpec artifacts：

- `add-scenario-catalog`
- `add-agent-skill-runtime`
- `add-model-provider-abstraction`
- `add-file-badcase-log`
- `add-practice-session-flow`
- `add-prompt-context-builder`
- `add-react-skill-orchestration`
- `add-local-practice-history`
- `add-text-practice-demo-flow`
- `add-qwen-realtime-voice-provider`
- `add-realtime-voice-practice-ui`

## 已实现的最小文本闭环

已按实现顺序完成最小文本练习闭环：

- Scenario Catalog
  - 5 个内置场景：
    - `job-interview`
    - `restaurant-ordering`
    - `business-meeting`
    - `airport-travel`
    - `daily-small-talk`
- Practice Session Flow
  - session 状态机
  - turn schema
  - rolling summary
  - conversation memory snapshot
- Local Practice History
  - localStorage repository 边界
  - 最多 50 条 session
  - failed session 最多 10 条
  - 禁止保存 secrets、audio、hidden reasoning
- File Badcase Log
  - JSONL append/read
  - BadcaseSignal
  - BadcaseHint
- Prompt Context Builder
  - `PromptContextBundle`
  - provider-neutral `PromptMessage`
  - T1/T2/T3 渲染
- ReAct Orchestration
  - bounded ReAct
  - `maxSteps = 5`
  - `maxRetriesPerStep = 1`
  - `maxProviderFailures = 2`
  - quality decision
- Model Provider Abstraction
  - mock provider 默认
  - Qwen text provider 配置边界
  - structured JSON validation
- Agent Skill Runtime
  - active single skill loading
  - `SkillRunRequest`
- Next 文本 Demo
  - `POST /api/practice-sessions`
  - `POST /api/practice-sessions/:id/turns`
  - `POST /api/practice-sessions/:id/end`
  - `GET /api/practice-sessions/:id`
  - 页面支持文本练习、轻纠错、总结

验证曾通过：

- `npm test`
- `npm run lint`
- `npm run build`

## 实时轻纠错策略

用户确认实时轻纠错可以用中文。

当前实现已调整为：

- 练习对话内容保持英文。
- 实时轻纠错 explanation 使用中文。
- 原句和修改句仍可保留英文。
- 用户说话期间不打断。
- 每轮最多展示一条高置信纠错。
- 低置信纠错进入 summary。

示例：

```text
这里用 I'd like 会更自然、更礼貌，适合口语场景。
```

## Realtime voice 当前状态

已落并实现了部分 realtime provider / voice UI 骨架：

- realtime provider 类型
- realtime session/event/error schema
- mock realtime provider
- Qwen realtime provider 配置边界
- realtime provider registry
- voice UI 状态机
- provider event -> UI state mapping
- audio chunk 校验
- 中文轻纠错 display policy
- Next realtime routes：
  - `POST /api/realtime-practice-sessions`
  - `POST /api/realtime-practice-sessions/:id/audio`
  - `GET /api/realtime-practice-sessions/:id/events`
- 页面增加“文本 / 语音”模式切换

但是当前语音模式仍是 mock-first 骨架，不是真实语音链路：

- 没有真正调用浏览器麦克风录音。
- 没有把真实 audio chunks 送到 Qwen WebSocket。
- 没有播放 Qwen 返回的真实音频。
- 页面里的“模拟一句语音”仍是 mock 数据。

用户指出这一点后，已明确需要纠偏。

## Qwen realtime 真实接入方向

用户指定多模态实时模型：

```text
qwen3.5-omni-plus-realtime
```

真实 API key 曾在对话中出现，但不得写入文件。此摘要中已脱敏，不记录真实 key。建议用户吊销旧 key 并重新生成。

本地配置建议：

```env
MODEL_PROVIDER=qwen
QWEN_REALTIME_MODEL=qwen3.5-omni-plus-realtime
DASHSCOPE_API_KEY=新的本地 key
```

`.gitignore` 已覆盖：

```gitignore
.env*
```

官方文档确认 Qwen realtime 走 WebSocket：

```text
wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=qwen3.5-omni-plus-realtime
```

国际站：

```text
wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime?model=qwen3.5-omni-plus-realtime
```

认证方式：

```text
Authorization: Bearer DASHSCOPE_API_KEY
```

参考来源：

- Alibaba Cloud Model Studio Qwen-Omni Realtime 文档
- Qwen Cloud realtime multimodal speech 文档

## 下一步建议

下一步应明确开一个纠偏实现任务，目标是真实语音链路，而不是 mock-first UI：

```text
connect-qwen-realtime-websocket
```

建议实现范围：

1. 浏览器端真正调用 `getUserMedia` 和 `MediaRecorder`。
2. 前端将 audio chunks 发送到自己的 Next API route。
3. Next server 使用 server-only key 建立 Qwen WebSocket session。
4. Server 将 audio chunk 转发给 Qwen。
5. Server 将 Qwen events 归一化为 `RealtimeProviderEvent`。
6. 前端展示真实 user transcript、assistant transcript。
7. 前端播放 Qwen 返回的 audio delta。
8. mock 仅作为无 key fallback。

## 当前需要注意的风险

- 不要再把真实 key 写进对话、代码、OpenSpec、README 或提交信息。
- 当前 voice UI 不是完整真实语音，只是骨架和 mock 事件流。
- Qwen realtime 的具体事件格式和音频格式需要严格按官方文档实现。
- 如果 Next Route Handler 不适合长期保持 WebSocket，会需要单独设计 Node runtime route、SSE bridge 或独立 server。
- Browser -> Server -> Qwen 的实时转发需要处理延迟、连接生命周期和关闭逻辑。

