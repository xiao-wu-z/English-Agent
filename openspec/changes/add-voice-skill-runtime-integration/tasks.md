## 1. Voice Skill Flow Contract

- [x] 1.1 创建 `src/lib/voice-skill-flow/types.ts`。
- [x] 1.2 定义 voice transcript turn input。
- [x] 1.3 定义 voice skill result。
- [x] 1.4 定义 safe voice history payload。

## 2. Orchestrator

- [x] 2.1 创建 `src/lib/voice-skill-flow/orchestrator.server.ts`。
- [x] 2.2 将 `transcript.user.final` 转成 practice turn。
- [x] 2.3 调用现有 skill runtime。
- [x] 2.4 生成 realtime correction。
- [x] 2.5 end session 时生成 assessment 和 summary。

## 3. Integration

- [x] 3.1 在 realtime voice flow 中接入 voice skill flow。
- [x] 3.2 partial transcript 不进入正式 history。
- [x] 3.3 final transcript 写入 local history。
- [x] 3.4 badcase 只记录 safe summary。

## 4. Tests

- [x] 4.1 测试 final transcript 触发 skill runtime。
- [x] 4.2 测试 partial transcript 不持久化。
- [x] 4.3 测试 realtime correction 中文展示。
- [x] 4.4 测试 summary/assessment 输出 schema。
- [x] 4.5 测试 raw audio 和 hidden reasoning 不进入结果。

## 5. Verification

- [x] 5.1 运行 `npm test`。
- [x] 5.2 运行 `npm run lint`。
- [x] 5.3 运行 `npm run build`。
- [x] 5.4 运行 `openspec status --change add-voice-skill-runtime-integration`。
