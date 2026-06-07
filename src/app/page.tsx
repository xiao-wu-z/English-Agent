"use client";

import { FormEvent, useRef, useState } from "react";
import {
  buildPcmAudioChunkMetadata,
  detectPcmCaptureSupport,
  encodePcm16,
  mixToMono,
  PCM_CAPTURE_MIME_TYPE,
  resampleLinear,
} from "@/lib/pcm-audio-capture";
import {
  DEFAULT_VOICE_TIMEOUT_POLICY,
  createVoiceRecoveryTimerRegistry,
  decideVoiceRecovery,
  getVoiceRecoveryMessage,
  mapTimeoutToRecoveryReason,
  type VoiceTimeoutType,
  type VoiceRecoveryReason,
  type VoiceRecoveryTimerRegistry,
} from "@/lib/realtime-voice-recovery";
import {
  decodeBase64ToBytes,
  decodePcm16ToFloat32,
  QWEN_OUTPUT_SAMPLE_RATE,
  reducePlaybackQueue,
  type QwenPlaybackQueueState,
} from "@/lib/qwen-pcm-playback";
import type { RealtimeProviderEvent } from "@/lib/model-providers/realtime-types";
import {
  applyRealtimeEventToVoiceState,
  type VoicePracticeUiState,
} from "@/lib/realtime-voice-ui";
import { selectSupportedMediaRecorderMimeType } from "@/lib/voice-audio-format/browser";
import { voiceDiagnosticsSchema } from "@/lib/voice-e2e-validation";

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

type VoiceEvent = RealtimeProviderEvent;

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
  const [voiceAudioMimeType, setVoiceAudioMimeType] = useState<string | null>(null);
  const [voiceSseStatus, setVoiceSseStatus] = useState("idle");
  const [voiceFallbackReason, setVoiceFallbackReason] = useState("none");
  const [playbackState, setPlaybackState] = useState<QwenPlaybackQueueState>({
    queue: [],
    status: "idle",
  });
  const [isRecording, setIsRecording] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const audioSequenceRef = useRef(0);
  const sseRecoveryAttemptsRef = useRef(0);
  const timerRegistryRef = useRef<VoiceRecoveryTimerRegistry>(
    createVoiceRecoveryTimerRegistry({
      setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
      clearTimeout: (id) => window.clearTimeout(id as number),
    }),
  );
  const activeScenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];

  function applyVoiceRecovery(reason: VoiceRecoveryReason, attempts = 0) {
    const decision = decideVoiceRecovery({ reason, attempts });
    setVoiceFallbackReason(reason);
    setVoiceStatus(decision.health === "fallback_text" ? "failed" : "thinking");
    setError(getVoiceRecoveryMessage(reason));
    if (decision.action === "fallback_to_text" || decision.action === "show_safe_error") {
      stopRecording();
    }
  }

  function startVoiceTimer(timeoutType: VoiceTimeoutType) {
    timerRegistryRef.current.start(
      timeoutType,
      DEFAULT_VOICE_TIMEOUT_POLICY[timeoutType],
      () => applyVoiceRecovery(mapTimeoutToRecoveryReason(timeoutType)),
    );
  }

  function clearVoiceTimer(timeoutType: VoiceTimeoutType) {
    timerRegistryRef.current.clear(timeoutType);
  }

  function refreshSseIdleTimer() {
    clearVoiceTimer("sse_idle_timeout");
    startVoiceTimer("sse_idle_timeout");
  }

  async function playQwenAudioDelta(audio: { encoding: string; data: string }) {
    if (audio.encoding !== "pcm/base64") {
      return;
    }
    try {
      const bytes = decodeBase64ToBytes(audio.data);
      const samples = decodePcm16ToFloat32(bytes);
      const context = playbackContextRef.current ?? new AudioContext();
      playbackContextRef.current = context;
      const buffer = context.createBuffer(1, samples.length, QWEN_OUTPUT_SAMPLE_RATE);
      const playbackSamples = new Float32Array(samples.length);
      playbackSamples.set(samples);
      buffer.copyToChannel(playbackSamples, 0);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start();
      setPlaybackState((state) => reducePlaybackQueue(state, { type: "consume" }));
    } catch {
      setPlaybackState((state) =>
        reducePlaybackQueue(state, {
          type: "fail",
          message: "语音播放失败，已切换为文本显示。",
        }),
      );
      setError("语音播放失败，已切换为文本显示。");
    }
  }

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
    setVoiceSseStatus("idle");
    setVoiceFallbackReason("none");
    setVoiceStatus("requesting_microphone");
    setVoiceAudioMimeType(PCM_CAPTURE_MIME_TYPE);
    setVoiceStatus("connecting");
    startVoiceTimer("qwen_connect_timeout");
    const response = await fetch("/api/realtime-practice-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId }),
    });
    const data = await response.json();
    clearVoiceTimer("qwen_connect_timeout");
    if (!response.ok) {
      setVoiceStatus("failed");
      setError(data.error?.message ?? "创建语音练习失败");
      return;
    }
    setVoiceSessionId(data.session.id);
    eventSourceRef.current?.close();
    setVoiceSseStatus("connecting");
    const eventSource = new EventSource(
      `/api/realtime-practice-sessions/${data.session.id}/events`,
    );
    eventSource.addEventListener("realtime.event", (event) => {
      const parsed = JSON.parse((event as MessageEvent).data) as VoiceEvent;
      setVoiceSseStatus("connected");
      sseRecoveryAttemptsRef.current = 0;
      refreshSseIdleTimer();
      setVoiceEvents((items) => [...items, parsed]);
      const audio = parsed.audio;
      if (audio) {
        setPlaybackState((state) =>
          reducePlaybackQueue(state, { type: "enqueue", item: audio }),
        );
        void playQwenAudioDelta(audio);
      }
      if (parsed.type === "transcript.assistant.final") {
        clearVoiceTimer("no_assistant_response_timeout");
        setVoiceStatus("speaking");
      } else if (parsed.type === "transcript.user.final") {
        clearVoiceTimer("no_user_speech_timeout");
        startVoiceTimer("no_assistant_response_timeout");
        setVoiceStatus("thinking");
      } else if (parsed.type === "session.closed") {
        clearVoiceTimer("sse_idle_timeout");
        eventSource.close();
        setVoiceSseStatus("closed");
        setVoiceStatus("completed");
      }
    });
    eventSource.addEventListener("realtime.heartbeat", () => {
      setVoiceSseStatus("connected");
      refreshSseIdleTimer();
    });
    eventSource.onerror = () => {
      setVoiceSseStatus("disconnected");
      setVoiceFallbackReason("sse_disconnected");
      applyVoiceRecovery("sse_disconnected", sseRecoveryAttemptsRef.current);
      sseRecoveryAttemptsRef.current += 1;
    };
    eventSourceRef.current = eventSource;
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

  async function startRecording() {
    if (!voiceSessionId) {
      return;
    }
    setError(null);
    startVoiceTimer("microphone_permission_timeout");
    const pcmSupport = detectPcmCaptureSupport();
    if (pcmSupport.supported) {
      await startPcmRecording(voiceSessionId);
      return;
    }
    if (!("MediaRecorder" in window)) {
      setVoiceStatus("failed");
      setError(pcmSupport.message);
      return;
    }
    const mimeSelection = selectSupportedMediaRecorderMimeType((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType),
    );
    if (!mimeSelection.supported) {
      setVoiceStatus("failed");
      setError(mimeSelection.message);
      return;
    }
    setVoiceAudioMimeType(mimeSelection.mimeType);
    await startMediaRecorderFallback(voiceSessionId, mimeSelection.mimeType);
  }

  async function startPcmRecording(activeVoiceSessionId: string) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    clearVoiceTimer("microphone_permission_timeout");
    mediaStreamRef.current = stream;
    audioSequenceRef.current = 0;
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    await audioContext.audioWorklet.addModule("/pcm-capture-worklet.js");
    const source = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext, "pcm-capture-processor");
    audioWorkletNodeRef.current = workletNode;
    workletNode.port.onmessage = async (event: MessageEvent<{
      type: string;
      sampleRate: number;
      channels: Float32Array[];
    }>) => {
      if (event.data.type !== "audio-frame") {
        return;
      }
      const mono = mixToMono(event.data.channels);
      const resampled = resampleLinear(mono, event.data.sampleRate);
      const pcmBytes = encodePcm16(resampled);
      if (pcmBytes.byteLength === 0) {
        return;
      }
      const sequence = audioSequenceRef.current;
      audioSequenceRef.current += 1;
      const metadata = buildPcmAudioChunkMetadata({
        sequence,
        byteLength: pcmBytes.byteLength,
      });
      const pcmBody = pcmBytes.buffer.slice(
        pcmBytes.byteOffset,
        pcmBytes.byteOffset + pcmBytes.byteLength,
      ) as ArrayBuffer;
      startVoiceTimer("audio_send_timeout");
      const response = await fetch(
        `/api/realtime-practice-sessions/${activeVoiceSessionId}/audio`,
        {
          method: "POST",
          headers: {
            "Content-Type": PCM_CAPTURE_MIME_TYPE,
            "X-Audio-Chunk-Metadata": JSON.stringify(metadata),
          },
          body: new Blob([pcmBody], { type: PCM_CAPTURE_MIME_TYPE }),
        },
      );
      if (!response.ok) {
        clearVoiceTimer("audio_send_timeout");
        const data = await response.json();
        setIsRecording(false);
        setVoiceStatus("failed");
        setVoiceFallbackReason("audio_send_failed");
        setError(data.error?.message ?? "语音发送失败，可以先使用文本练习。");
      }
      clearVoiceTimer("audio_send_timeout");
      startVoiceTimer("no_user_speech_timeout");
    };
    source.connect(workletNode);
    workletNode.connect(audioContext.destination);
    setVoiceAudioMimeType(PCM_CAPTURE_MIME_TYPE);
    setIsRecording(true);
    setVoiceStatus("listening");
  }

  async function startMediaRecorderFallback(
    activeVoiceSessionId: string,
    mimeType: string,
  ) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    clearVoiceTimer("microphone_permission_timeout");
    mediaStreamRef.current = stream;
    audioSequenceRef.current = 0;
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = async (event) => {
      if (!event.data || event.data.size === 0) {
        return;
      }
      const sequence = audioSequenceRef.current;
      audioSequenceRef.current += 1;
      startVoiceTimer("audio_send_timeout");
      const response = await fetch(
        `/api/realtime-practice-sessions/${activeVoiceSessionId}/audio`,
        {
          method: "POST",
          headers: {
            "Content-Type": event.data.type || mimeType,
            "X-Audio-Chunk-Metadata": JSON.stringify({
              mimeType: event.data.type || mimeType,
              sequence,
              byteLength: event.data.size,
            }),
          },
          body: event.data,
        },
      );
      if (!response.ok) {
        clearVoiceTimer("audio_send_timeout");
        const data = await response.json();
        setIsRecording(false);
        setVoiceStatus("failed");
        setVoiceFallbackReason(
          data.error?.message?.includes("unsupported_audio_format")
            ? "unsupported_audio_format"
            : "audio_send_failed",
        );
        setError(
          data.error?.message?.includes("unsupported_audio_format")
            ? "当前浏览器录音格式暂不能直连实时模型，请先使用文本练习。"
            : data.error?.message ?? "语音发送失败",
        );
      }
      clearVoiceTimer("audio_send_timeout");
      startVoiceTimer("no_user_speech_timeout");
    };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setVoiceStatus("listening");
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    audioWorkletNodeRef.current?.disconnect();
    void audioContextRef.current?.close();
    void playbackContextRef.current?.close();
    timerRegistryRef.current.clearAll();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    audioWorkletNodeRef.current = null;
    audioContextRef.current = null;
    playbackContextRef.current = null;
    mediaStreamRef.current = null;
    setIsRecording(false);
  }

  async function cancelVoiceSession() {
    stopRecording();
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    if (voiceSessionId) {
      await fetch(`/api/realtime-practice-sessions/${voiceSessionId}/end`, {
        method: "POST",
      });
    }
    setVoiceStatus("abandoned");
    setPlaybackState({ queue: [], status: "idle" });
    setVoiceSessionId(null);
  }

  const voiceDiagnostics = voiceSessionId
    ? voiceDiagnosticsSchema.parse({
        sessionId: voiceSessionId,
        providerName: "realtime",
        modelName: "qwen3.5-omni-plus-realtime",
        audioFormat: voiceAudioMimeType ?? "unknown",
        sseStatus: voiceSseStatus,
        lastEventType: voiceEvents.at(-1)?.type ?? "none",
        fallbackReason: voiceFallbackReason,
      })
    : null;
  const voiceTranscriptState = voiceEvents.reduce<VoicePracticeUiState>(
    applyRealtimeEventToVoiceState,
    { status: "connecting", messages: [], playbackQueue: [] },
  );

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
                {voiceTranscriptState.messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`max-w-[76%] rounded-md border px-3 py-2 text-sm leading-6 ${
                        message.role === "user"
                          ? "ml-auto border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-200 bg-white"
                      }`}
                    >
                      {message.content}
                    </div>
                  ))}
                {voiceTranscriptState.userPartialTranscript ? (
                  <div className="ml-auto max-w-[76%] rounded-md border border-neutral-950 bg-neutral-950 px-3 py-2 text-sm leading-6 text-white opacity-70">
                    {voiceTranscriptState.userPartialTranscript}
                  </div>
                ) : null}
                {voiceTranscriptState.assistantPartialTranscript ? (
                  <div className="max-w-[76%] rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm leading-6 opacity-70">
                    {voiceTranscriptState.assistantPartialTranscript}
                  </div>
                ) : null}
                {voiceEvents.length === 0 ? (
                  <div className="rounded-md border border-dashed border-neutral-300 bg-white p-5 text-sm text-neutral-600">
                    开始录音后会把浏览器音频片段发送到实时会话；不保存原始音频。
                  </div>
                ) : null}
              </div>
              <div className="space-y-3">
                <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
                  <div className="font-medium">麦克风</div>
                  <p className="mt-2 text-neutral-600">
                    优先使用 PCM16 16k 采集，不保存原始音频。
                  </p>
                  {voiceAudioMimeType ? (
                    <p className="mt-2 font-mono text-xs text-neutral-500">
                      {voiceAudioMimeType}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
                  <div className="font-medium">播放队列</div>
                  <p className="mt-2 text-neutral-600">
                    {voiceEvents.filter((event) => event.type === "audio.delta").length} 个 audio delta
                  </p>
                  <p className="mt-1 text-neutral-600">状态：{playbackState.status}</p>
                  {playbackState.errorMessage ? (
                    <p className="mt-1 text-red-700">{playbackState.errorMessage}</p>
                  ) : null}
                </div>
                {voiceDiagnostics ? (
                  <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
                    <div className="font-medium">诊断</div>
                    <p className="mt-2 text-neutral-600">SSE：{voiceDiagnostics.sseStatus}</p>
                    <p className="mt-1 text-neutral-600">事件：{voiceDiagnostics.lastEventType}</p>
                    <p className="mt-1 text-neutral-600">回退：{voiceDiagnostics.fallbackReason}</p>
                  </div>
                ) : null}
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
                disabled={!voiceSessionId || voiceStatus === "abandoned" || isRecording}
                onClick={startRecording}
                type="button"
              >
                开始录音
              </button>
              <button
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm disabled:opacity-40"
                disabled={!isRecording}
                onClick={stopRecording}
                type="button"
              >
                停止录音
              </button>
              <button
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm disabled:opacity-40"
                disabled={!voiceSessionId || voiceStatus === "abandoned"}
                onClick={sendMockVoiceTurn}
                type="button"
              >
                模拟文本事件
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
