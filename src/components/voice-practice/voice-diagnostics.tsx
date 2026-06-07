export function VoiceDiagnostics(props: {
  status: string;
  sseStatus: string;
  playbackStatus: string;
  audioFormat: string;
  audioDeltaCount: number;
}) {
  return (
    <details className="rounded-3xl border border-slate-200 bg-white p-5 text-sm">
      <summary className="cursor-pointer font-medium text-slate-700">
        连接与音频状态
      </summary>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
        <dt className="text-slate-400">练习状态</dt>
        <dd className="text-right text-slate-700">{props.status}</dd>
        <dt className="text-slate-400">实时连接</dt>
        <dd className="text-right text-slate-700">{props.sseStatus}</dd>
        <dt className="text-slate-400">语音播放</dt>
        <dd className="text-right text-slate-700">{props.playbackStatus}</dd>
        <dt className="text-slate-400">音频格式</dt>
        <dd className="truncate text-right font-mono text-slate-700">
          {props.audioFormat}
        </dd>
        <dt className="text-slate-400">音频片段</dt>
        <dd className="text-right text-slate-700">{props.audioDeltaCount}</dd>
      </dl>
    </details>
  );
}
