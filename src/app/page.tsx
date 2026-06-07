"use client";

import { FormEvent, useRef, useState } from "react";
import type {
  CorrectionItem,
  PracticeSummary,
} from "@/lib/agent-skill-contracts/schema";
import {
  ConversationTranscript,
  CorrectionPanel,
  PracticeReport,
  ScenarioPicker,
  VoiceControls,
  VoiceDiagnostics,
} from "@/components/voice-practice";
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
  schedulePcmPlayback,
  type QwenPlaybackQueueState,
} from "@/lib/qwen-pcm-playback";
import type { RealtimeProviderEvent } from "@/lib/model-providers/realtime-types";
import {
  applyRealtimeEventToVoiceState,
  type VoicePracticeUiState,
} from "@/lib/realtime-voice-ui";
import { selectSupportedMediaRecorderMimeType } from "@/lib/voice-audio-format/browser";
import { voiceDiagnosticsSchema } from "@/lib/voice-e2e-validation";
import { getAllScenarios } from "@/lib/scenarios";
import {
  createVoicePracticeResponseSchema,
  toVoicePracticeScenario,
  voicePracticeEventSchema,
  voicePracticeReportResponseSchema,
  type VoicePracticeReportResponse,
} from "@/lib/voice-practice-client";
import {
  getPrimaryVoiceAction,
  isScenarioSelectionLocked,
} from "@/lib/voice-practice-ui/view-model";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type PracticeMode = "text" | "voice";

type VoiceEvent = RealtimeProviderEvent;

const scenarios = getAllScenarios().map(toVoicePracticeScenario);

export default function Home() {
  const [mode, setMode] = useState<PracticeMode>("voice");
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState("未开始");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [correction, setCorrection] = useState<string | null>(null);
  const [summary, setSummary] = useState<PracticeSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [voiceEvents, setVoiceEvents] = useState<VoiceEvent[]>([]);
  const [voiceCorrection, setVoiceCorrection] = useState<CorrectionItem | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [voiceReport, setVoiceReport] =
    useState<VoicePracticeReportResponse | null>(null);
  const [isEndingVoice, setIsEndingVoice] = useState(false);
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
  const playbackNextStartTimeRef = useRef(0);
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
      if (context.state === "suspended") {
        await context.resume();
      }
      const buffer = context.createBuffer(1, samples.length, QWEN_OUTPUT_SAMPLE_RATE);
      const playbackSamples = new Float32Array(samples.length);
      playbackSamples.set(samples);
      buffer.copyToChannel(playbackSamples, 0);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      const schedule = schedulePcmPlayback({
        currentTime: context.currentTime,
        nextStartTime: playbackNextStartTimeRef.current,
        sampleCount: samples.length,
        sampleRate: QWEN_OUTPUT_SAMPLE_RATE,
      });
      playbackNextStartTimeRef.current = schedule.endTime;
      source.start(schedule.startTime);
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
    stopPlayback();
    setError(null);
    setVoiceCorrection(null);
    setVoiceNotice(null);
    setVoiceReport(null);
    setIsEndingVoice(false);
    setVoiceEvents([]);
    playbackNextStartTimeRef.current = 0;
    setPlaybackState({ queue: [], status: "idle" });
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
    const rawData = await response.json();
    clearVoiceTimer("qwen_connect_timeout");
    if (!response.ok) {
      setVoiceStatus("failed");
      setError(rawData.error?.message ?? "创建语音练习失败");
      return;
    }
    const data = createVoicePracticeResponseSchema.parse(rawData);
    setVoiceSessionId(data.session.id);
    eventSourceRef.current?.close();
    setVoiceSseStatus("connecting");
    const eventSource = new EventSource(
      `/api/realtime-practice-sessions/${data.session.id}/events`,
    );
    eventSource.addEventListener("realtime.event", (event) => {
      const parsed = voicePracticeEventSchema.parse(
        JSON.parse((event as MessageEvent).data),
      );
      setVoiceSseStatus("connected");
      sseRecoveryAttemptsRef.current = 0;
      refreshSseIdleTimer();
      if (parsed.type === "correction.ready") {
        setVoiceCorrection(parsed.correction);
        return;
      }
      if (parsed.type === "workflow.error") {
        setVoiceNotice(parsed.error.message);
        return;
      }
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
        setVoiceSseStatus("closed");
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

  async function startRecording() {
    if (!voiceSessionId) {
      return;
    }
    setError(null);
    const playbackContext = playbackContextRef.current ?? new AudioContext();
    playbackContextRef.current = playbackContext;
    if (playbackContext.state === "suspended") {
      await playbackContext.resume();
    }
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
    timerRegistryRef.current.clearAll();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    audioWorkletNodeRef.current = null;
    audioContextRef.current = null;
    mediaStreamRef.current = null;
    setIsRecording(false);
  }

  function stopPlayback() {
    void playbackContextRef.current?.close();
    playbackContextRef.current = null;
    playbackNextStartTimeRef.current = 0;
    setPlaybackState({ queue: [], status: "idle" });
  }

  async function finishVoiceSession() {
    if (!voiceSessionId || isEndingVoice) {
      return;
    }
    stopRecording();
    setError(null);
    setVoiceNotice(null);
    setIsEndingVoice(true);
    setVoiceStatus("ending");
    startVoiceTimer("summary_timeout");
    const response = await fetch(
      `/api/realtime-practice-sessions/${voiceSessionId}/end`,
      { method: "POST" },
    );
    const rawData = await response.json();
    clearVoiceTimer("summary_timeout");
    if (!response.ok) {
      setIsEndingVoice(false);
      setVoiceStatus("failed");
      setError(rawData.error?.message ?? "报告生成失败，可以保留本次对话后重试。");
      return;
    }
    const report = voicePracticeReportResponseSchema.parse(rawData);
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setVoiceSseStatus("closed");
    setVoiceReport(report);
    setVoiceStatus("completed");
    setIsEndingVoice(false);
  }

  async function cancelVoiceSession() {
    stopRecording();
    stopPlayback();
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    if (voiceSessionId) {
      await fetch(`/api/realtime-practice-sessions/${voiceSessionId}/end`, {
        method: "POST",
      });
    }
    setVoiceStatus("idle");
    setVoiceSessionId(null);
    setVoiceEvents([]);
    setVoiceCorrection(null);
    setVoiceNotice(null);
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
  const primaryVoiceAction = getPrimaryVoiceAction({
    hasSession: Boolean(voiceSessionId),
    isRecording,
    isEnding: isEndingVoice,
  });
  const scenarioSelectionLocked = isScenarioSelectionLocked(voiceStatus);

  function handlePrimaryVoiceAction() {
    if (primaryVoiceAction.id === "start_session") {
      void startVoiceSession();
    } else if (primaryVoiceAction.id === "stop_recording") {
      stopRecording();
      setVoiceStatus("thinking");
    } else {
      void startRecording();
    }
  }

  if (mode === "voice" && voiceReport) {
    return (
      <PracticeReport
        onChooseScenario={() => {
          setVoiceReport(null);
          setVoiceSessionId(null);
          setVoiceStatus("idle");
        }}
        onRestart={() => {
          setVoiceReport(null);
          setVoiceSessionId(null);
          setVoiceStatus("idle");
          void startVoiceSession();
        }}
        savedToHistory={voiceReport.savedToHistory}
        scenario={voiceReport.scenario}
        summary={voiceReport.summary}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eef2ff,_#f8fafc_42%,_#f8fafc)] text-slate-950">
      <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600">ENGLISH AGENT</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              把英语练习变成一场真实对话
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              选择一个场景，直接开口。AI 会保持角色、自然追问，并在合适的时候给出克制的轻纠错。
            </p>
          </div>
          <div className="grid grid-cols-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <button
              className={`rounded-xl px-5 py-2.5 text-sm font-medium ${
                mode === "voice" ? "bg-indigo-600 text-white" : "text-slate-500"
              }`}
              onClick={() => setMode("voice")}
              type="button"
            >
              语音练习
            </button>
            <button
              className={`rounded-xl px-5 py-2.5 text-sm font-medium ${
                mode === "text" ? "bg-indigo-600 text-white" : "text-slate-500"
              }`}
              onClick={() => setMode("text")}
              type="button"
            >
              文本练习
            </button>
          </div>
        </header>

        <section className="mt-9">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">选择练习场景</h2>
              <p className="mt-1 text-sm text-slate-500">
                每个场景都有不同角色、目标和反馈重点。
              </p>
            </div>
            {scenarioSelectionLocked ? (
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-600">
                练习中不可切换
              </span>
            ) : null}
          </div>
          <ScenarioPicker
            locked={scenarioSelectionLocked}
            onSelect={(id) => {
              setScenarioId(id);
              setError(null);
            }}
            scenarios={scenarios}
            selectedId={scenarioId}
          />
        </section>

        {mode === "text" ? (
          <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{activeScenario.titleZh}</h2>
                <p className="mt-1 text-sm text-slate-500">状态：{status}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
                  onClick={startSession}
                  type="button"
                >
                  开始文本练习
                </button>
                <button
                  className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm disabled:opacity-40"
                  disabled={!sessionId || status !== "active"}
                  onClick={endSession}
                  type="button"
                >
                  结束
                </button>
              </div>
            </div>
            <div className="mt-6">
              <ConversationTranscript
                emptyMessage="开始后输入一句英文，AI 会围绕当前场景继续对话。"
                messages={messages}
              />
            </div>
            {correction ? (
              <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                轻纠错：{correction}
              </div>
            ) : null}
            {summary ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                本次得分 {summary.overallScore}：{summary.strengths[0]}
              </div>
            ) : null}
            <form className="mt-4 flex gap-3" onSubmit={submitTurn}>
              <input
                className="min-w-0 flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                disabled={!sessionId || status !== "active"}
                onChange={(event) => setInput(event.target.value)}
                placeholder="输入一句英文回答..."
                value={input}
              />
              <button
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
                disabled={!sessionId || status !== "active"}
                type="submit"
              >
                发送
              </button>
            </form>
          </section>
        ) : (
          <section className="mt-8 grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
            <aside className="space-y-5">
              <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-xl">
                <p className="text-xs font-medium text-indigo-300">当前场景</p>
                <h2 className="mt-2 text-xl font-semibold">{activeScenario.titleZh}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  你是 {activeScenario.userRole}，AI 将扮演 {activeScenario.aiRole}。
                </p>
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-xs text-slate-400">本次目标</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-200">
                    {activeScenario.goals.map((goal) => (
                      <li key={goal} className="flex gap-2">
                        <span className="text-indigo-300">✓</span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {voiceDiagnostics ? (
                <VoiceDiagnostics
                  audioDeltaCount={voiceEvents.filter(
                    (event) => event.type === "audio.delta",
                  ).length}
                  audioFormat={voiceDiagnostics.audioFormat}
                  playbackStatus={playbackState.status}
                  sseStatus={voiceDiagnostics.sseStatus}
                  status={voiceStatus}
                />
              ) : null}
            </aside>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">实时对话</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {voiceStatus === "listening"
                      ? "正在听你说..."
                      : voiceStatus === "thinking"
                        ? "AI 正在思考..."
                        : voiceStatus === "speaking"
                          ? "AI 正在回答..."
                          : "准备好后开始练习"}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm ring-1 ring-slate-200">
                  {activeScenario.maxSessionMinutes} 分钟建议时长
                </span>
              </div>
              <ConversationTranscript
                assistantPartial={voiceTranscriptState.assistantPartialTranscript}
                emptyMessage="点击“开始语音练习”建立会话，再点击“开始说话”。你的实时字幕和 AI 回复会显示在这里。"
                messages={voiceTranscriptState.messages}
                userPartial={voiceTranscriptState.userPartialTranscript}
              />
              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  {error}
                </div>
              ) : null}
              <VoiceControls
                hasSession={Boolean(voiceSessionId)}
                isEnding={isEndingVoice}
                isRecording={isRecording}
                onCancel={() => void cancelVoiceSession()}
                onEnd={() => void finishVoiceSession()}
                onPrimary={handlePrimaryVoiceAction}
                primaryDisabled={primaryVoiceAction.disabled}
                primaryLabel={primaryVoiceAction.label}
              />
            </div>

            <aside className="space-y-5">
              <CorrectionPanel
                correction={voiceCorrection}
                notice={voiceNotice ?? playbackState.errorMessage}
              />
              <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5">
                <h3 className="font-semibold text-indigo-950">练习提示</h3>
                <p className="mt-3 text-sm leading-6 text-indigo-900/70">
                  先完整表达，再关注准确度。实时轻纠错只显示最值得立即调整的一项，更多反馈会进入课后报告。
                </p>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
