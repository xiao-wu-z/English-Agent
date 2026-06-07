export type PcmCaptureSupportInput = {
  hasGetUserMedia: boolean;
  hasAudioContext: boolean;
  hasAudioWorklet: boolean;
};

export type PcmCaptureSupportResult =
  | {
      supported: true;
    }
  | {
      supported: false;
      message: string;
    };

export function selectPcmCaptureSupport(
  input: PcmCaptureSupportInput,
): PcmCaptureSupportResult {
  if (input.hasGetUserMedia && input.hasAudioContext && input.hasAudioWorklet) {
    return { supported: true };
  }
  return {
    supported: false,
    message: "当前浏览器暂不支持实时 PCM 录音，请先使用文本练习。",
  };
}

export function detectPcmCaptureSupport(): PcmCaptureSupportResult {
  const browserWindow = typeof window !== "undefined"
    ? window as Window & typeof globalThis & {
        webkitAudioContext?: typeof AudioContext;
      }
    : undefined;
  const audioContextConstructor = browserWindow?.AudioContext ??
    browserWindow?.webkitAudioContext;
  return selectPcmCaptureSupport({
    hasGetUserMedia: typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia),
    hasAudioContext: Boolean(audioContextConstructor),
    hasAudioWorklet: typeof AudioWorkletNode !== "undefined",
  });
}
