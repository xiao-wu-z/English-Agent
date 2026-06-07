import type { AudioChunkMetadata } from "../voice-audio-format/index.ts";

export const PCM_CAPTURE_MIME_TYPE = "audio/pcm;rate=16000";
export const PCM_CAPTURE_SAMPLE_RATE = 16000;
export const PCM_CAPTURE_CHANNELS = 1;

function clampSample(sample: number): number {
  return Math.max(-1, Math.min(1, sample));
}

export function encodePcm16(samples: Float32Array): Uint8Array {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = clampSample(samples[index]);
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(index * 2, Math.trunc(int16), true);
  }
  return bytes;
}

export function mixToMono(channels: Float32Array[]): Float32Array {
  if (channels.length === 0) {
    return new Float32Array();
  }
  if (channels.length === 1) {
    return channels[0];
  }
  const length = Math.min(...channels.map((channel) => channel.length));
  const mono = new Float32Array(length);
  for (let sampleIndex = 0; sampleIndex < length; sampleIndex += 1) {
    let sum = 0;
    for (const channel of channels) {
      sum += channel[sampleIndex];
    }
    mono[sampleIndex] = sum / channels.length;
  }
  return mono;
}

export function resampleLinear(
  input: Float32Array,
  inputSampleRate: number,
  outputSampleRate = PCM_CAPTURE_SAMPLE_RATE,
): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return input;
  }
  if (input.length === 0 || inputSampleRate <= 0 || outputSampleRate <= 0) {
    return new Float32Array();
  }
  const outputLength = Math.floor(input.length * (outputSampleRate / inputSampleRate));
  const output = new Float32Array(outputLength);
  const ratio = inputSampleRate / outputSampleRate;
  for (let outputIndex = 0; outputIndex < outputLength; outputIndex += 1) {
    const inputIndex = outputIndex * ratio;
    const left = Math.floor(inputIndex);
    const right = Math.min(left + 1, input.length - 1);
    const weight = inputIndex - left;
    output[outputIndex] = input[left] * (1 - weight) + input[right] * weight;
  }
  return output;
}

export function buildPcmAudioChunkMetadata(input: {
  sequence: number;
  byteLength: number;
  durationMs?: number;
}): AudioChunkMetadata {
  return {
    mimeType: PCM_CAPTURE_MIME_TYPE,
    sequence: input.sequence,
    byteLength: input.byteLength,
    sampleRate: PCM_CAPTURE_SAMPLE_RATE,
    channels: PCM_CAPTURE_CHANNELS,
    durationMs: input.durationMs,
  };
}
