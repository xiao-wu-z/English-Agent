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
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState("未开始");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [correction, setCorrection] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
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
          <button
            className="mt-5 w-full rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
            onClick={startSession}
            type="button"
          >
            开始练习
          </button>
        </aside>
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
      </div>
    </main>
  );
}
