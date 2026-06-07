export const QWEN_OUTPUT_SAMPLE_RATE = 24000;

export function decodeBase64ToBytes(base64: string): Uint8Array {
  const maybeBuffer = (globalThis as typeof globalThis & {
    Buffer?: typeof Buffer;
  }).Buffer;
  if (maybeBuffer) {
    return Uint8Array.from(maybeBuffer.from(base64, "base64"));
  }
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function decodePcm16ToFloat32(bytes: Uint8Array): Float32Array {
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const samples = new Float32Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    const value = view.getInt16(index * 2, true);
    samples[index] = value < 0 ? value / 0x8000 : value / 0x7fff;
  }
  return samples;
}
