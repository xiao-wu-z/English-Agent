## Why

英语陪练 Demo 后续接入真实模型后，评测、纠错、总结和 provider 结构化输出都可能出现错误。没有证据记录，只能凭感觉改 prompt 或 Skill，难以持续降低幻觉和错误纠错概率。

本变更建立轻量 file-based badcase log，用 JSONL 记录失败信号，并把 badcase 转换成短小 `BadcaseHint`，作为三层 Prompt 架构中 Tier 3 的动态上下文来源。V1 不引入向量数据库、自动 judge 或后台管理。

## What Changes

- 新增 `BadcaseSignal` schema，记录失败信号、场景归因、Skill 归因、输入快照、用户反馈和状态。
- 新增 badcase kind：
  - `wrong_correction`
  - `low_quality_assessment`
  - `bad_summary`
  - `user_dismissed_correction`
  - `user_regenerated`
  - `provider_schema_failure`
- 新增按类别分文件的 JSONL 存储：
  - `data/badcases/correction.jsonl`
  - `data/badcases/assessment.jsonl`
  - `data/badcases/summary.jsonl`
  - `data/badcases/provider.jsonl`
- 新增 append/read helper：
  - `appendBadcaseSignal`
  - `readBadcaseSignals`
  - `getBadcaseFilePath`
- 新增 `BadcaseHint` schema，把完整 badcase signal 转成可进入 prompt 的短提示。
- 新增 `toBadcaseHint` 和 `getRelevantBadcaseHints`：
  - 按 `scenarioId`、`skillId`、kind 和 limit 做轻量过滤。
  - 返回短 hint，不把完整 inputSnapshot 注入 prompt。
- 明确 badcase 在三层 Prompt 中属于 Tier 3：Runtime State + Relevant Badcase Hints。
- 本变更不做自动 judge、不做向量检索、不做 SQLite、不做 UI、不做回归测试 runner。

## Capabilities

### New Capabilities

- `file-badcase-log`: 定义基于磁盘 JSONL 的 badcase 记录、读取、分类文件映射、BadcaseHint 转换和相关 hint 查询。

### Modified Capabilities

- 无。

## Impact

- 新增 `src/lib/badcases/` 模块。
- 新增默认数据目录 `data/badcases/`，实现时应确保测试使用临时目录，不污染真实数据。
- 后续 `add-agent-skill-runtime` 的 Tier 3 runtime state 可以消费 `BadcaseHint[]`。
- 后续 model provider 可以把 `provider_schema_failure` 写入 badcase log。
- 后续 correction、assessment、summary 模块可以写入对应 badcase signal。
