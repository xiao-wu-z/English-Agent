## 1. Agent Skill 文档

- [x] 1.1 创建 `agent-skills/english-practice/SKILL.md`，定义实时陪练 Agent 的目的、触发条件、输入、流程、输出、质量门槛、禁止行为、失败处理和示例。
- [x] 1.2 创建 `agent-skills/english-assessment/SKILL.md`，定义评测 Agent 的评分维度、AI 回复质量检查、幻觉风险判断、置信度标签和结构化输出要求。
- [x] 1.3 创建 `agent-skills/english-correction/SKILL.md`，定义实时轻纠错和课后完整纠错的选择规则、展示时机、低置信抑制策略和纠错输出格式。
- [x] 1.4 创建 `agent-skills/english-summary/SKILL.md`，定义课后总结 Agent 的输入来源、报告结构、学习建议规则和禁止官方考试式宣称。

## 2. 输出数据合同

- [x] 2.1 创建 `src/lib/agent-skill-contracts/schema.ts`，用 Zod 定义共享枚举、0-100 分数、置信度、风险等级和推荐动作。
- [x] 2.2 在 schema 中定义 `PracticeTurnGuidance`、`AssessmentResult`、`QualityAssessment`、`CorrectionItem` 和 `PracticeSummary`。
- [x] 2.3 创建 `src/lib/agent-skill-contracts/index.ts`，统一导出 schema 和 TypeScript 类型。

## 3. 合同一致性校验

- [x] 3.1 确认四个 `SKILL.md` 的 Output Contract 与 `schema.ts` 中的数据结构一致。
- [x] 3.2 确认纠错 Skill 默认支持 `after_turn` 和 `summary`，并限制实时纠错为高置信、最多一条、非打断式展示。
- [x] 3.3 确认评测和总结 Skill 明确禁止把内部评分描述成 IELTS、TOEFL、CEFR 或音素级官方评分。

## 4. 验证

- [x] 4.1 运行 `npm run lint`，确认新增类型和导出不引入 lint 错误。
- [x] 4.2 运行 `npm run build`，确认 Next.js 项目可构建。
- [x] 4.3 运行 `openspec status --change add-agent-skill-contracts`，确认 proposal、design、specs、tasks 均已就绪。
- [x] 4.4 人工复查 `agent-skills/` 文档，确认它们规范 Agent 工作流程，而不是只描述普通场景 prompt。
