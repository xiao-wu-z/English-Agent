import type { VoicePracticeScenario } from "@/lib/voice-practice-client";
import { getDifficultyLabel } from "@/lib/voice-practice-ui/view-model";

export function ScenarioPicker(props: {
  scenarios: VoicePracticeScenario[];
  selectedId: string;
  locked: boolean;
  onSelect: (scenarioId: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {props.scenarios.map((scenario) => {
        const selected = scenario.id === props.selectedId;
        return (
          <button
            key={scenario.id}
            className={`group rounded-3xl border p-5 text-left transition ${
              selected
                ? "border-indigo-500 bg-indigo-50 shadow-[0_16px_40px_rgba(79,70,229,0.12)]"
                : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            disabled={props.locked}
            onClick={() => props.onSelect(scenario.id)}
            type="button"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-lg font-semibold text-slate-950">
                {scenario.titleZh}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
                {getDifficultyLabel(scenario.difficulty)}
              </span>
            </div>
            <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
              {scenario.descriptionZh}
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
              <span>{scenario.maxSessionMinutes} 分钟</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>
                你是 {scenario.userRole} · AI 是 {scenario.aiRole}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
