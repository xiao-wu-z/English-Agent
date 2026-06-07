## Context

English-Agent 已经通过 `add-agent-skill-contracts` 定义了四个产品 Agent Skill：练习、评测、纠错、总结。现在缺少的是稳定的 Scenario Catalog。Scenario 负责“练什么”，Agent Skills 负责“怎么练、怎么评、怎么纠、怎么总结”。

我们从 `ai-tuoke-mt-agent` 中吸取两点设计：第一，Skill 文档不应该每轮全量塞进 prompt，而应该通过稳定 catalog 和按需注入进入模型上下文；第二，Prompt 应该分层，避免所有规则、场景、历史和运行状态堆在一段大提示词里。

本 change 只实现三层 Prompt 设计中的 Tier 2 场景输入部分，不实现完整 Prompt Builder，也不接通义、OpenAI 或任何 Realtime provider。

## Goals / Non-Goals

**Goals:**

- 建立五个 V1 内置场景：面试、餐厅点餐、商务会议、机场旅行、日常闲聊。
- 用 Zod schema 校验场景结构和 catalog-level invariants。
- 提供统一 Scenario Catalog API，避免业务代码直接读取 JSON。
- 给每个场景绑定四个 Agent Skill：practice、assessment、correction、summary。
- 保持场景 provider-neutral，不绑定通义、OpenAI、DashScope、WebRTC、WebSocket 或具体模型。
- 输出 `ScenarioPromptContext`，作为后续三层 Prompt Builder 的 Tier 2 输入。
- 为 history、summary 和 file-based badcase log 预留 `scenarioId`、`scenarioVersion`、`goalId` 归因字段。

**Non-Goals:**

- 不实现 Prompt Builder。
- 不实现 Model Provider Adapter。
- 不调用通义、OpenAI 或其他模型。
- 不实现 Realtime / WebRTC / WebSocket 语音链路。
- 不实现 UI。
- 不实现 badcase 记录。
- 不实现用户自定义场景或后台管理。

## Decisions

### Decision 1: 场景使用静态 JSON + Zod 校验

V1 场景数量固定且需要快速交付，静态 JSON 足够清晰，也便于后续迁移到后台配置。Zod 提供运行时校验和 TypeScript 类型推导。

替代方案是直接写 TS 常量。TS 常量类型更直接，但会让内容编辑和未来后台迁移更不自然。另一个替代方案是数据库配置，但 V1 没有登录、数据库或后台管理范围。

### Decision 2: 场景英文为主，中文仅用于 UI 展示

`titleZh` 和 `descriptionZh` 用于 UI；`context`、`goals`、`constraints`、`promptHints` 使用英文，因为这些字段会进入模型上下文。这样减少中英混杂对英语口语陪练的影响。

### Decision 3: 场景绑定 Agent Skill，但不控制流程

每个场景提供：

```ts
skillBindings: {
  practice: "english-practice";
  assessment: "english-assessment";
  correction: "english-correction";
  summary: "english-summary";
}
```

场景不写完整流程 prompt，不描述评测/纠错/总结步骤。流程由 `agent-skills/` 下的 `SKILL.md` 控制，后续 Prompt Builder 负责组合 Scenario + Skill + Runtime State。

### Decision 4: 提供 `ScenarioPromptContext`

Catalog API 会提供 `toScenarioPromptContext(scenario)`，输出结构化 Tier 2 数据：

```ts
{
  scenarioId;
  scenarioVersion;
  setting;
  aiRole;
  userRole;
  learnerPurpose;
  goals;
  constraints;
  vocabulary;
  sampleUserIntents;
  tone;
}
```

本 change 不拼完整 prompt。这样既为三层 Prompt 架构打基础，又避免过早把模型供应商和运行状态耦合进场景目录。

### Decision 5: Catalog API 是唯一入口

后续模块只从 `src/lib/scenarios` 导入：

- `getAllScenarios`
- `getScenarioById`
- `assertScenarioById`
- `getScenariosByDifficulty`
- `toScenarioPromptContext`

这样 UI、Realtime API、Summary API、Prompt Builder 和 badcase log 都依赖同一个校验后的场景合同。

### Decision 6: 三层 Prompt 设计作为后续架构方向

后续 Prompt Builder 应按以下分层组织：

```text
Tier 1: Global Coach Rules
  - 英语陪练身份
  - 不冒充官方评分
  - 不暴露 chain-of-thought
  - provider-neutral
  - API key 不进前端

Tier 2: Scenario + Active Agent Skill
  - 当前场景上下文
  - 当前 skill: practice / assessment / correction / summary
  - 当前目标、角色、限制、词汇提示

Tier 3: Runtime State
  - 最近 transcript
  - 当前 goal progress
  - assessment result
  - correction candidates
  - session state
```

本 change 只让 Scenario 能稳定进入 Tier 2。

## Module Boundaries

- `src/scenarios/*.json`: 五个内置场景配置。
- `src/lib/scenarios/schema.ts`: Zod schema、类型、共享枚举、字段校验。
- `src/lib/scenarios/catalog.ts`: raw scenarios import、catalog validation、查询函数、prompt context 转换。
- `src/lib/scenarios/index.ts`: 对外统一导出。
- `src/lib/scenarios/schema.test.ts`: catalog 和 schema 行为测试。

## Data Flow

```text
src/scenarios/*.json
        ↓
scenarioSchema
        ↓
validateScenarioCatalog
        ↓
getAllScenarios / getScenarioById / assertScenarioById
        ↓
toScenarioPromptContext
        ↓
future Prompt Builder Tier 2
```

## Error Handling

- 场景 JSON 格式错误时，schema parse 失败。
- 场景 ID 重复时，catalog validation 抛出清晰错误。
- goal ID 重复时，schema 或 catalog validation 抛出清晰错误。
- `assertScenarioById` 找不到场景时，抛出包含 scenario id 的错误。
- provider/transport 词出现在 prompt-facing 字段时，catalog validation 抛出错误，避免场景污染 provider-neutral 边界。

## Risks / Trade-offs

- [Risk] 英文约束校验过于机械，可能误判专有名词或缩写 → Mitigation: 只对 prompt-facing 字段做轻量 ASCII/常见英文标点校验，中文 UI 字段不受影响。
- [Risk] 静态 JSON 后续扩展为后台配置时需要迁移 → Mitigation: schema 和 catalog API 先稳定，数据源未来可从 JSON 替换为远端配置。
- [Risk] 场景字段太多导致第一步变重 → Mitigation: 只保留 prompt context、skill binding、goals 和 constraints 必需字段，不实现 UI/runtime/provider。
- [Risk] 三层 Prompt 只写设计不实现，后续可能漂移 → Mitigation: spec 明确 `ScenarioPromptContext` 合同，后续 `add-prompt-context-builder` 必须消费该合同。

## Migration Plan

这是新增能力，不需要数据迁移。

实施顺序：

1. 创建五个场景 JSON。
2. 创建 scenario schema 和类型。
3. 创建 catalog API 和 validation。
4. 添加 schema/catalog 测试。
5. 运行 `npm test`、`npm run lint`、`npm run build`。

## Open Questions

- 后续是否允许用户自定义场景。V1 不实现，但 schema 应避免阻碍扩展。
- 后续 Prompt Builder 是否加载完整 Agent Skill 文档，还是只加载摘要和 output contract。倾向按任务最小注入。
