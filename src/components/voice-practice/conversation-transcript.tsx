export type TranscriptMessage = {
  role: "user" | "assistant";
  content: string;
};

export function ConversationTranscript(props: {
  messages: TranscriptMessage[];
  userPartial?: string;
  assistantPartial?: string;
  emptyMessage: string;
}) {
  const hasContent =
    props.messages.length > 0 ||
    Boolean(props.userPartial) ||
    Boolean(props.assistantPartial);

  return (
    <div className="min-h-[420px] space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      {!hasContent ? (
        <div className="flex min-h-[370px] items-center justify-center text-center">
          <div className="max-w-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
              “
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              {props.emptyMessage}
            </p>
          </div>
        </div>
      ) : null}
      {props.messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 ${
              message.role === "user"
                ? "rounded-br-lg bg-indigo-600 text-white"
                : "rounded-bl-lg bg-slate-100 text-slate-800"
            }`}
          >
            {message.content}
          </div>
        </div>
      ))}
      {props.userPartial ? (
        <div className="flex justify-end">
          <div className="max-w-[82%] rounded-3xl rounded-br-lg bg-indigo-100 px-4 py-3 text-sm leading-6 text-indigo-900">
            {props.userPartial}
            <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
          </div>
        </div>
      ) : null}
      {props.assistantPartial ? (
        <div className="flex justify-start">
          <div className="max-w-[82%] rounded-3xl rounded-bl-lg bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">
            {props.assistantPartial}
            <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-slate-400" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
