## Why

Recovery policy 已有 schema、timeout 和 decision，但 UI 还没有实际计时器与状态转换。用户体验上，如果麦克风无权限、SSE 卡住、音频发送后无 transcript，界面需要主动恢复或 fallback，而不是一直停留在 listening/thinking。

## What

- 在 voice UI 中接入 recovery timeout policy。
- 添加 microphone permission timeout。
- 添加 SSE idle timeout。
- 添加 no user speech timeout。
- 添加 no assistant response timeout。
- 添加 audio send timeout。
- 根据 decision 显示中文 safe message。
- 记录 safe recovery badcase signal。

## Impact

- 语音练习更稳定，避免无限等待。
- 不改变 Qwen provider。
- 不保存 raw audio 或 secrets。
