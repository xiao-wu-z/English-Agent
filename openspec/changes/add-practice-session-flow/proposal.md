## Why

English-Agent 已经规划了 Scenario Catalog、Agent Skill Runtime、Model Provider Abstraction 和 File-Based Badcase Log，但还缺少一次英语陪练从开始到结束的主链路规格。没有稳定的 session flow，后续 UI、Realtime 语音、skill runner、summary 和本地历史都会各自定义状态，容易产生重复和不一致。

长对话历史也是同一个问题的一部分。完整 transcript 适合用于课后展示和追溯，但不应该每轮都完整进入模型上下文。需要在 session flow 中同步定义 full transcript、recent turns、rolling summary 和 prompt runtime memory snapshot 的边界。

## What

- 定义 practice session 生命周期和状态转换。
- 定义 session、turn、runtime event、rolling summary 和 conversation memory snapshot 数据合同。
- 定义完整历史保存和模型上下文输入分离的规则。
- 定义长对话压缩触发条件，但不在本 change 中调用模型生成压缩摘要。
- 定义本地 session repository 接口，默认面向本地历史，避免业务层锁死到具体存储。
- 定义实时轻纠错、课后评测/纠错/总结的触发位置。
- 定义 session event hook，为后续 skill runtime、provider 和 badcase log 接入预留边界。

## Impact

- 新增 `practice-session-flow` capability。
- 后续 `agent-skill-runtime`、`model-provider-abstraction`、`file-badcase-log` 和 Realtime UI 可共享同一套 session/memory 合同。
- 不新增模型调用、不新增 UI、不新增数据库、不实现实时语音。
