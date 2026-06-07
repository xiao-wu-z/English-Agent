## Why

English-Agent 不能只依赖“一轮提示词直接输出给用户”。英语陪练中的实时纠错、评测和总结都存在幻觉风险：模型可能过度自信、纠错不准确、评测缺少证据、或者输出不符合 schema。需要一个 bounded ReAct orchestration 合同，把 observe、act、assess、decide 和 final 的过程规范下来。

这个 change 的目标不是做复杂多 Agent planner，而是把每次 Skill 输出进入用户界面前必须经过质量闸门这件事固定下来，并通过最大步数、重试次数和停止条件防止无限循环。

## What

- 定义 bounded ReAct run、step、decision 和 loop policy 数据合同。
- 定义默认最大步数、单步重试次数和 provider failure 上限。
- 定义 observe -> act -> assess -> decide -> final 的 MVP 链路。
- 定义质量闸门，复用 confidence label、risk level 和 quality assessment 思路。
- 定义停止条件，包括 max steps、high risk、schema retry failure、provider failure、session abandoned/failed。
- 定义安全降级动作：show、suppress、retry、defer_to_summary、ask_clarifying_question、log_badcase、final。
- 定义 badcase signal 触发点。
- 明确不暴露 chain-of-thought，不做无限循环，不调用真实模型。

## Impact

- 新增 `react-skill-orchestration` capability。
- 后续 Agent Skill Runtime 和 Model Provider 可以围绕 bounded ReAct loop 接入。
- 后续 UI 只消费 decision/final result，不消费隐藏推理。
- 后续 badcase log 可接入高风险、schema failure 和用户否定反馈。
