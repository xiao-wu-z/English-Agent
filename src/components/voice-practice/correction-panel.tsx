import type { CorrectionItem } from "@/lib/agent-skill-contracts/schema";

export function CorrectionPanel(props: {
  correction: CorrectionItem | null;
  notice?: string | null;
}) {
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-200/70 text-sm font-bold text-amber-900">
          Aa
        </span>
        <div>
          <h3 className="font-semibold text-amber-950">实时轻纠错</h3>
          <p className="text-xs text-amber-800/70">只提示高置信、值得立即记住的表达</p>
        </div>
      </div>
      {props.correction ? (
        <div className="mt-5 space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
              你的表达
            </p>
            <p className="mt-1 text-sm text-amber-950 line-through decoration-amber-400">
              {props.correction.original}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              更自然的说法
            </p>
            <p className="mt-1 rounded-2xl bg-white px-3 py-2 text-sm font-medium text-emerald-900 shadow-sm">
              {props.correction.corrected}
            </p>
          </div>
          <p className="text-sm leading-6 text-amber-900">
            {props.correction.explanation}
          </p>
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-amber-900/70">
          完成一轮表达后，值得立即改进的内容会显示在这里。
        </p>
      )}
      {props.notice ? (
        <p className="mt-4 rounded-2xl bg-white/70 px-3 py-2 text-xs text-amber-900">
          {props.notice}
        </p>
      ) : null}
    </section>
  );
}
