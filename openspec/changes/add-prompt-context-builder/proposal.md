## Why

English-Agent 已经规划了 Scenario Catalog、Agent Skill Runtime、Practice Session Flow、File-Based Badcase Log 和 Model Provider Abstraction。现在缺少一个明确的 Prompt Context Builder，负责把这些模块的结构化数据按三层 Prompt 架构组装成 provider-neutral messages。

如果没有独立 builder，Agent Skill Runtime、Provider Adapter 或 UI 很容易各自拼接 prompt，导致 T1/T2/T3 边界混乱、完整 transcript 被误塞进模型、badcase hints 覆盖核心规则、或者 provider/API key 等实现细节进入 prompt。

## What

- 定义 `PromptContextBundle`，保留 T1/T2/T3 的结构化输入。
- 定义 provider-neutral `PromptMessage`。
- 定义 `buildPromptContextBundle`，把 core rules、scenario context、active skill instruction、conversation memory snapshot、badcase hints 和 current task input 组合成 bundle。
- 定义 `renderPromptMessages`，把 bundle 渲染成 provider-neutral messages。
- 定义 context budget、recent turn limit 和 badcase hint limit。
- 定义 prompt metadata，用于调试上下文污染和 prompt 膨胀。
- 明确 provider、model name、API key、transport detail 不得进入 prompt。

## Impact

- 新增 `prompt-context-builder` capability。
- 后续 Agent Skill Runtime 可以使用 builder 生成 `SkillRunRequest.messages`。
- 后续 Model Provider 只消费 messages 和 expected output schema，不读取 scenario、skill markdown 或 session 内部结构。
- 不新增模型调用、不实现 ReAct loop、不实现 UI、不实现实时语音。
