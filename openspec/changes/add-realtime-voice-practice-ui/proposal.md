## Why

English-Agent 的文本 Demo 已经跑通，Qwen realtime voice provider 也已有 provider 层规格。下一步需要定义真正的语音练习 UI 和浏览器音频链路：用户如何授权麦克风、如何开始/停止语音练习、实时转写如何展示、AI 音频和字幕如何回到界面、轻纠错何时展示。

这个 change 不实现真实 Qwen 接入细节，而是把 Next.js 前端语音体验、browser audio、provider event bridge 和 practice session orchestration 的边界规范下来。默认仍应能用 mock realtime provider 跑通。

## What

- 定义 realtime voice practice UI 状态机。
- 定义麦克风权限和录音状态。
- 定义 MediaRecorder-based MVP audio input。
- 定义 provider event 到 UI state 的映射。
- 定义 AI transcript 和 audio playback queue 边界。
- 定义用户 final transcript 后中文轻纠错展示策略。
- 定义结束练习和 summary 触发。
- 定义安全边界：前端不直接调用通义，不保存原始音频，不暴露 API key。

## Impact

- 新增 `realtime-voice-practice-ui` capability。
- 后续实现可在现有文本页面基础上增加语音模式。
- 消费 `add-qwen-realtime-voice-provider` 的 normalized events。
- 不新增真实 API key、不保存音频、不实现复杂重连或完整音频可视化。
