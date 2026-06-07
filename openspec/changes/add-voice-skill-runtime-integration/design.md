## Context

当前 text practice flow 已有 skills、prompt context、bounded ReAct、history 和 summary。voice flow 目前主要负责 realtime events。需要把 transcript 转成与文本 turn 兼容的数据，而不是复制一套语音专用业务逻辑。

## Goals / Non-Goals

**Goals:**

- Qwen final user transcript 生成 voice turn。
- correction skill 对 high-confidence issue 产出中文轻纠错。
- end session 生成 summary 和 assessment。
- voice history 使用 transcript，不存 raw audio。
- 保持三层 prompt 架构。

**Non-Goals:**

- 不让 Qwen realtime 直接替代 skills。
- 不保存音频文件。
- 不做复杂发音评分。

## Decisions

### Decision 1: Transcript 是 skill runtime 的输入边界

只在 `transcript.user.final` 后触发 skill runtime。partial transcript 只用于 UI 展示，不进入正式评测数据。

### Decision 2: 语音和文本共享 PracticeSession schema

新增 modality 字段或 voice metadata，但 turn 内容仍是文本 transcript。

### Decision 3: 轻纠错遵守现有实时纠错规则

用户说话期间不打断；final transcript 后最多展示一条 high-confidence correction；其余 defer 到 summary。

## Proposed Modules

- `src/lib/voice-skill-flow/orchestrator.server.ts`
- `src/lib/voice-skill-flow/types.ts`
- `src/lib/voice-skill-flow/index.ts`

## Data Flow

```text
Qwen transcript.user.final
  ↓
Voice skill flow creates practice turn
  ↓
Correction skill optional realtime correction
  ↓
Assistant transcript / reply stored
  ↓
End session
  ↓
Assessment + summary skills
  ↓
Local history safe transcript record
```
