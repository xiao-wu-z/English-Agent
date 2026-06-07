export function VoiceControls(props: {
  primaryLabel: string;
  primaryDisabled: boolean;
  isRecording: boolean;
  hasSession: boolean;
  isEnding: boolean;
  onPrimary: () => void;
  onEnd: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        className={`min-w-40 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
          props.isRecording
            ? "bg-rose-500 hover:bg-rose-600"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
        disabled={props.primaryDisabled}
        onClick={props.onPrimary}
        type="button"
      >
        {props.isRecording ? "● " : ""}
        {props.primaryLabel}
      </button>
      <button
        className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
        disabled={!props.hasSession || props.isEnding}
        onClick={props.onEnd}
        type="button"
      >
        {props.isEnding ? "正在生成报告..." : "结束并生成报告"}
      </button>
      <button
        className="ml-auto rounded-2xl px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
        disabled={!props.hasSession || props.isEnding}
        onClick={props.onCancel}
        type="button"
      >
        取消练习
      </button>
    </div>
  );
}
