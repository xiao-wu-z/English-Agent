"use client";

import { FormEvent, useState } from "react";

type ScenarioOption = {
  id: string;
  titleZh: string;
  descriptionZh: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Summary = {
  overallScore: number;
  strengths: string[];
  priorityIssues: string[];
  recommendedExpressions: string[];
  nextPracticeSuggestions: string[];
  disclaimer: string;
};

type PracticeMode = "text" | "voice";

type VoiceEvent = {
  type: string;
  text?: string;
  audio?: {
    encoding: string;
    data: string;
  };
};

const scenarios: ScenarioOption[] = [
  {
    id: "daily-small-talk",
    titleZh: "日常闲聊",
    descriptionZh: "练习简单日常对话和自然追问。",
  },
  {
    id: "restaurant-ordering",
    titleZh: "餐厅点餐",
    descriptionZh: "练习点餐、询问菜品和礼貌回应。",
  },
  {
    id: "job-interview",
    titleZh: "求职面试",
    descriptionZh: "练习清晰、自然地回答英文面试问题。",
  },
  {
    id: "airport-travel",
    titleZh: "机场旅行",
    descriptionZh: "练习在机场询问信息和处理旅行场景。",
  },
  {
    id: "business-meeting",
    titleZh: "商务会议",
    descriptionZh: "练习会议汇报、提问和回应。",
  },
];

export default function Home() {
  const [mode, setMode] = useState<PracticeMode>("text");
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState("未开始");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [correction, setCorrection] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [voiceEvents, setVoiceEvents] = useState<VoiceEvent[]>([]);
  const [voiceCorrection, setVoiceCorrection] = useState<string | null>(null);
  const activeScenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];

  async function startSession() {
    setError(null);
    setSummary(null);
    setCorrection(null);
    const response = await fetch("/api/practice-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message ?? "创建练习失败");
      return;
    }
    setSessionId(data.session.id);
    setStatus(data.session.status);
    setMessages([
      {
        role: "assistant",
        content: "Let's start. Please answer in English.",
      },
    ]);
  }

  async function submitTurn(event: FormEvent) {
    event.preventDefault();
    if (!sessionId || input.trim().length === 0) {
      return;
    }
    const userText = input.trim();
    setInput("");
    setError(null);
    const response = await fetch(`/api/practice-sessions/${sessionId}/turns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userText }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message ?? "提交失败");
      return;
    }
    setStatus(data.session.status);
    setMessages((items) => [
      ...items,
      { role: "user", content: userText },
      { role: "assistant", content: data.aiReply },
    ]);
    setCorrection(data.realtimeCorrection?.explanation ?? null);
  }

  async function endSession() {
    if (!sessionId) {
      return;
    }
    setError(null);
    const response = await fetch(`/api/practice-sessions/${sessionId}/end`, {
      method: "POST",
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message ?? "结束练习失败");
      return;
    }
    setStatus(data.session.status);
    setSummary(data.summary);
  }

  async function startVoiceSession() {
    setError(null);
    setVoiceCorrection(null);
    setVoiceEvents([]);
    setVoiceStatus("requesting_microphone");
    if (typeof window !== "undefined" && !("MediaRecorder" in window)) {
      setVoiceStatus("failed");
      setError("当前浏览器不支持录音能力，请先使用文本练习。");
      return;
    }
    setVoiceStatus("connecting");
    const response = await fetch("/api/realtime-practice-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId }),
    });
    const data = await response.json();
    if (!response.ok) {
      setVoiceStatus("failed");
      setError(data.error?.message ?? "创建语音练习失败");
      return;
    }
    setVoiceSessionId(data.session.id);
    setVoiceStatus("listening");
  }

  async function sendMockVoiceTurn() {
    if (!voiceSessionId) {
      return;
    }
    setError(null);
    setVoiceStatus("thinking");
    const response = await fetch(
      `/api/realtime-practice-sessions/${voiceSessionId}/audio`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "I want talk about weekend." }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setVoiceStatus("failed");
      setError(data.error?.message ?? "语音事件发送失败");
      return;
    }
    const events = data.events as VoiceEvent[];
    setVoiceEvents(events);
    setVoiceStatus("speaking");
    setVoiceCorrection("这里用 I'd like to talk about... 会更自然，适合口语表达。");
  }

  function cancelVoiceSession() {
    setVoiceStatus("abandoned");
    setVoiceSessionId(null);
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-6 py-6">
        <aside className="w-80 shrink-0 border-r border-neutral-200 pr-5">
          <h1 className="text-xl font-semibold">英语语音陪练 MVP</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            先用文本跑通练习闭环，后续接入实时语音。
          </p>
          <div className="mt-5 space-y-2">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                className={`w-full rounded-md border px-3 py-3 text-left text-sm ${
                  scenario.id === scenarioId
                    ? "border-neutral-950 bg-white"
                    : "border-neutral-200 bg-neutral-100"
                }`}
                onClick={() => {
                  setScenarioId(scenario.id);
                  setError(null);
                }}
                type="button"
              >
                <span className="block font-medium">{scenario.titleZh}</span>
                <span className="mt-1 block text-neutral-600">
                  {scenario.descriptionZh}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-md border border-neutral-200 bg-neutral-100 p-1 text-sm">
            <button
              className={`rounded px-3 py-2 ${mode === "text" ? "bg-white shadow-sm" : ""}`}
              onClick={() => setMode("text")}
              type="button"
            >
              文本
            </button>
            <button
              className={`rounded px-3 py-2 ${mode === "voice" ? "bg-white shadow-sm" : ""}`}
              onClick={() => setMode("voice")}
              type="button"
            >
              语音
            </button>
          </div>
          <button
            className="mt-5 w-full rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
            onClick={mode === "text" ? startSession : startVoiceSession}
            type="button"
          >
            {mode === "text" ? "开始文本练习" : "开始语音练习"}
          </button>
        </aside>
        {mode === "text" ? (
          <section className="flex min-h-[calc(100vh-48px)] flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <div>
              <h2 className="text-lg font-semibold">{activeScenario.titleZh}</h2>
              <p className="text-sm text-neutral-600">状态：{status}</p>
            </div>
            <button
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-40"
              disabled={!sessionId || status !== "active"}
              onClick={endSession}
              type="button"
            >
              结束练习
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[72%] rounded-md border px-3 py-2 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-auto border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>
          {correction ? (
            <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              轻纠错：{correction}
            </div>
          ) : null}
          {summary ? (
            <div className="mb-3 rounded-md border border-neutral-200 bg-white p-4 text-sm">
              <div className="font-medium">课后总结：{summary.overallScore} 分</div>
              <p className="mt-2 text-neutral-700">{summary.strengths[0]}</p>
              <p className="mt-1 text-neutral-700">{summary.priorityIssues[0]}</p>
              <p className="mt-2 text-neutral-500">{summary.disclaimer}</p>
            </div>
          ) : null}
          {error ? (
            <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
              {error}
            </div>
          ) : null}
          <form className="flex gap-3 border-t border-neutral-200 pt-4" onSubmit={submitTurn}>
            <input
              className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              disabled={!sessionId || status !== "active"}
              onChange={(event) => setInput(event.target.value)}
              placeholder="输入一句英文回答..."
              value={input}
            />
            <button
              className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              disabled={!sessionId || status !== "active"}
              type="submit"
            >
              发送
            </button>
          </form>
        </section>
        ) : (
          <section className="flex min-h-[calc(100vh-48px)] flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <h2 className="text-lg font-semibold">{activeScenario.titleZh} · 语音模式</h2>
                <p className="text-sm text-neutral-600">状态：{voiceStatus}</p>
              </div>
              <button
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-40"
                disabled={!voiceSessionId}
                onClick={cancelVoiceSession}
                type="button"
              >
                取消语音练习
              </button>
            </div>
            <div className="grid flex-1 gap-4 py-4 lg:grid-cols-[1fr_280px]">
              <div className="space-y-3">
                {voiceEvents
                  .filter((event) => event.text)
                  .map((event, index) => (
                    <div
                      key={`${event.type}-${index}`}
                      className={`max-w-[76%] rounded-md border px-3 py-2 text-sm leading-6 ${
                        event.type.includes("user")
                          ? "ml-auto border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-200 bg-white"
                      }`}
                    >
                      {event.text}
                    </div>
                  ))}
                {voiceEvents.length === 0 ? (
                  <div className="rounded-md border border-dashed border-neutral-300 bg-white p-5 text-sm text-neutral-600">
                    语音模式默认使用 mock realtime provider。点击下方按钮模拟一次语音输入事件。
                  </div>
                ) : null}
              </div>
              <div className="space-y-3">
                <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
                  <div className="font-medium">麦克风</div>
                  <p className="mt-2 text-neutral-600">
                    MVP 使用 MediaRecorder 边界，不保存原始音频。
                  </p>
                </div>
                <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
                  <div className="font-medium">播放队列</div>
                  <p className="mt-2 text-neutral-600">
                    {voiceEvents.filter((event) => event.type === "audio.delta").length} 个 audio delta
                  </p>
                </div>
                {voiceCorrection ? (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                    轻纠错：{voiceCorrection}
                  </div>
                ) : null}
              </div>
            </div>
            {error ? (
              <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
                {error}
              </div>
            ) : null}
            <div className="flex gap-3 border-t border-neutral-200 pt-4">
              <button
                className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                disabled={!voiceSessionId || voiceStatus === "abandoned"}
                onClick={sendMockVoiceTurn}
                type="button"
              >
                模拟一句语音
              </button>
              <button
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
                onClick={startVoiceSession}
                type="button"
              >
                重新开始
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
