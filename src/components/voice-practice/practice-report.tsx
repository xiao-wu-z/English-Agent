import type { PracticeSummary } from "@/lib/agent-skill-contracts/schema";
import type { VoicePracticeScenario } from "@/lib/voice-practice-client";
import { getReportScoreRows } from "@/lib/voice-practice-ui/view-model";

export function PracticeReport(props: {
  scenario: VoicePracticeScenario;
  summary: PracticeSummary;
  savedToHistory: boolean;
  onRestart: () => void;
  onChooseScenario: () => void;
}) {
  const scores = getReportScoreRows(props.summary.dimensionScores);
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <section className="overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-2xl">
        <div className="grid gap-8 p-7 md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <p className="text-sm font-medium text-indigo-300">
              {props.scenario.titleZh} · 练习报告
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              你完成了一次有效的英语表达练习
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              报告关注表达效果与下一步练习方向，不代表专业语言考试成绩。
            </p>
          </div>
          <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-8 border-indigo-400 bg-white/10">
            <strong className="text-5xl">{props.summary.overallScore}</strong>
            <span className="mt-1 text-xs text-slate-300">综合表现</span>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">能力维度</h2>
          <div className="mt-5 space-y-4">
            {scores.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.label}</span>
                  <strong className="text-slate-900">{item.score}</strong>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <ReportList
            items={props.summary.strengths}
            title="做得好的地方"
            tone="emerald"
          />
          <ReportList
            items={props.summary.priorityIssues}
            title="优先提升"
            tone="amber"
          />
        </div>
      </section>

      {props.summary.correctedSentences.length > 0 ? (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">本次纠错</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {props.summary.correctedSentences.map((correction) => (
              <div key={correction.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-400 line-through">
                  {correction.original}
                </p>
                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  {correction.corrected}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {correction.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <ReportList
          items={props.summary.recommendedExpressions}
          title="推荐表达"
          tone="indigo"
        />
        <ReportList
          items={props.summary.nextPracticeSuggestions}
          title="下一步练习"
          tone="slate"
        />
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          onClick={props.onRestart}
          type="button"
        >
          再练一次
        </button>
        <button
          className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={props.onChooseScenario}
          type="button"
        >
          选择其他场景
        </button>
        <p className="text-xs text-slate-400">
          {props.savedToHistory ? "本次报告已保存到本地历史。" : "报告已生成，但本地历史保存失败。"}
        </p>
      </div>
    </main>
  );
}

function ReportList(props: {
  title: string;
  items: string[];
  tone: "emerald" | "amber" | "indigo" | "slate";
}) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-950",
    slate: "border-slate-200 bg-white text-slate-900",
  };
  return (
    <section className={`rounded-3xl border p-6 ${tones[props.tone]}`}>
      <h2 className="font-semibold">{props.title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6">
        {props.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
