import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPcmAudioChunkMetadata,
  encodePcm16,
  mixToMono,
  resampleLinear,
  selectPcmCaptureSupport,
} from "./index.ts";

describe("pcm audio capture", () => {
  it("encodes clamped Float32 samples to little-endian PCM16", () => {
    const bytes = encodePcm16(new Float32Array([-2, -1, 0, 0.5, 1, 2]));
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    assert.equal(view.getInt16(0, true), -32768);
    assert.equal(view.getInt16(2, true), -32768);
    assert.equal(view.getInt16(4, true), 0);
    assert.equal(view.getInt16(6, true), 16383);
    assert.equal(view.getInt16(8, true), 32767);
    assert.equal(view.getInt16(10, true), 32767);
  });

  it("mixes stereo channels down to mono", () => {
    const mono = mixToMono([
      new Float32Array([1, 0]),
      new Float32Array([0, 1]),
    ]);

    assert.deepEqual(Array.from(mono), [0.5, 0.5]);
  });

  it("resamples audio to the target sample rate with linear interpolation", () => {
    const output = resampleLinear(new Float32Array([0, 1, 0, -1]), 48000, 16000);

    assert.equal(output.length, 1);
    assert.equal(output[0], 0);
  });

  it("builds provider-compatible PCM metadata", () => {
    assert.deepEqual(buildPcmAudioChunkMetadata({
      sequence: 3,
      byteLength: 640,
      durationMs: 20,
    }), {
      mimeType: "audio/pcm;rate=16000",
      sequence: 3,
      byteLength: 640,
      sampleRate: 16000,
      channels: 1,
      durationMs: 20,
    });
  });

  it("returns Chinese fallback when PCM capture is unsupported", () => {
    const result = selectPcmCaptureSupport({
      hasGetUserMedia: true,
      hasAudioContext: false,
      hasAudioWorklet: true,
    });

    assert.equal(result.supported, false);
    assert.match(result.message, /文本练习/);
  });
});
