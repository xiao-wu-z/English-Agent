import { RealtimeProviderError } from "../model-providers/realtime-types.ts";

export function validateAudioChunk(chunk: Uint8Array): void {
  if (chunk.byteLength === 0) {
    throw new RealtimeProviderError({
      code: "audio_chunk_invalid",
      providerName: "browser",
      message: "audio_chunk_invalid: audio chunk is empty",
    });
  }
}

export function shouldPersistAudioChunk(): boolean {
  return false;
}

export function getMediaRecorderFallback(isSupported: boolean): string {
  return isSupported
    ? ""
    : "当前浏览器不支持录音能力，请先使用文本练习。";
}
