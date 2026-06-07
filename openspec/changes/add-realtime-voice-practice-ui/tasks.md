## 1. Voice UI State

- [ ] 1.1 创建 `src/lib/realtime-voice-ui/state.ts`，定义 voice UI state schema 和 TypeScript 类型。
- [ ] 1.2 实现状态转换 helper，覆盖 idle、requesting_microphone、ready、connecting、listening、thinking、speaking、ending、completed、failed、abandoned。
- [ ] 1.3 测试用户取消进入 abandoned，provider error 进入 failed。

## 2. Provider Event Mapping

- [ ] 2.1 创建 `src/lib/realtime-voice-ui/events.ts`，实现 normalized provider event 到 UI action/state 的映射。
- [ ] 2.2 `transcript.user.partial` 更新用户临时字幕。
- [ ] 2.3 `transcript.user.final` 提交用户最终 turn。
- [ ] 2.4 `transcript.assistant.partial` 更新 AI 临时字幕。
- [ ] 2.5 `transcript.assistant.final` 提交 AI 消息。
- [ ] 2.6 `audio.delta` 进入播放队列。
- [ ] 2.7 `error` 进入 failed 状态。

## 3. Browser Audio Boundary

- [ ] 3.1 创建 `src/lib/realtime-voice-ui/audio.ts`，定义 MediaRecorder 支持检测和 audio chunk 校验 helper。
- [ ] 3.2 明确 audio chunks 不进入 local history。
- [ ] 3.3 MediaRecorder 不可用时返回 safe fallback state/message。
- [ ] 3.4 不实现 AudioWorklet。

## 4. Realtime Correction Policy

- [ ] 4.1 创建 `src/lib/realtime-voice-ui/corrections.ts`，实现 final transcript 后 correction display policy。
- [ ] 4.2 high confidence 且 non-high risk 时最多展示一条中文轻纠错。
- [ ] 4.3 low/medium confidence 纠错不实时展示，标记 defer to summary。
- [ ] 4.4 listening 状态下不展示 correction。

## 5. Next Session Bridge

- [ ] 5.1 创建 realtime practice session route boundary，用于创建 provider session。
- [ ] 5.2 创建 audio chunk route boundary，用于接收前端 MediaRecorder chunks。
- [ ] 5.3 创建 event bridge route boundary，用于向前端提供 normalized provider events。
- [ ] 5.4 确保前端不直接调用 Qwen provider endpoint。
- [ ] 5.5 确保 API response 不包含 API key、Authorization header 或 provider secret。

## 6. Voice UI

- [ ] 6.1 在 `src/app/page.tsx` 增加文本/语音模式切换，保留文本 Demo。
- [ ] 6.2 语音模式展示麦克风权限状态、练习状态、用户 transcript、AI transcript、播放状态、轻纠错、结束按钮和 summary。
- [ ] 6.3 使用 mock realtime provider 默认跑通语音 UI 事件流。
- [ ] 6.4 不保存原始音频，不实现波形可视化，不实现复杂重连。

## 7. Tests

- [ ] 7.1 测试 voice UI state transitions。
- [ ] 7.2 测试 provider event mapping。
- [ ] 7.3 测试 audio chunk no-persist 和 MediaRecorder fallback。
- [ ] 7.4 测试 correction display policy：listening 不展示、final transcript 后最多一条中文纠错、低置信 defer。
- [ ] 7.5 测试 session bridge response 不包含 secrets。
- [ ] 7.6 测试文本 Demo 仍可用。

## 8. Verification

- [ ] 8.1 运行 `npm test`，确认现有测试和新增 realtime voice UI 测试均通过。
- [ ] 8.2 运行 `npm run lint`，确认新增 TypeScript/React 不引入 lint 错误。
- [ ] 8.3 运行 `npm run build`，确认 Next.js 项目可构建。
- [ ] 8.4 运行 `openspec status --change add-realtime-voice-practice-ui`，确认 proposal、design、specs、tasks 均已就绪。
