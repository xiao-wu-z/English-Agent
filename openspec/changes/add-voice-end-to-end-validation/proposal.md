## Why

PCM capture、Qwen WebSocket、SSE 和 recovery 分别实现后，还需要一个真实端到端验证边界。否则单元测试可能都通过，但实际 Demo 仍可能在麦克风权限、PCM chunk、Qwen transcript、SSE 展示或 session 关闭处断开。

本 change 用于建立语音 MVP 的端到端验证能力，覆盖真实用户路径和可观测的验收步骤。

## What

- 定义本地端到端验证脚本或手动验证 checklist。
- 覆盖 start session、record、send PCM、receive transcript、assistant reply、end session。
- 增加诊断状态：provider、audio format、SSE connected、last event、fallback reason。
- 增加非 secret debug endpoint 或 debug panel。
- 确认失败时能落到 recovery message。

## Impact

- 提升 Demo 前验证可靠性。
- 不新增生产数据库。
- 不记录 raw audio 或 API key。
