## Why

English-Agent MVP 需要让用户能在本地保留练习历史：完成过哪些场景、说了多少轮、总结和纠错结果是什么。`add-practice-session-flow` 已经定义了 session 和 repository 接口，但还没有定义本地持久化的 storage schema、容量策略和安全边界。

V1 Demo 不需要用户登录、云同步或数据库。使用 localStorage 可以快速落地，但业务层仍应依赖 `PracticeSessionRepository`，避免后续迁移 IndexedDB 或服务端存储时大面积改动。

## What

- 定义本地练习历史 storage schema。
- 定义 localStorage key：`english-agent.practice-sessions.v1`。
- 定义 storage version：`1`。
- 定义 `PracticeSessionListItem`，用于历史列表摘要。
- 定义 localStorage 版 `PracticeSessionRepository` 的行为边界。
- 定义容量策略：最多保存 50 条 session，failed session 最多保留最近 10 条。
- 定义裁剪策略：超过限制时优先删除最旧的 `completed` / `abandoned` session。
- 定义 storage error 类型。
- 明确禁止保存原始音频、API key、provider secret、authorization header、hidden reasoning 和 chain-of-thought。

## Impact

- 新增 `local-practice-history` capability。
- 后续 UI 可以基于本地 repository 展示练习历史。
- 后续 practice session orchestration 可以保存和更新 session。
- 不新增 UI、不新增服务端数据库、不保存音频、不调用模型、不写 badcase log。
