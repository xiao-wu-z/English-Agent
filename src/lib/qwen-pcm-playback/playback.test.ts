import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  QWEN_OUTPUT_SAMPLE_RATE,
  decodeBase64ToBytes,
  decodePcm16ToFloat32,
  reducePlaybackQueue,
} from "./index.ts";

describe("qwen pcm playback", () => {
  it("decodes base64 audio into bytes", () => {
    assert.deepEqual(Array.from(decodeBase64ToBytes("AQID")), [1, 2, 3]);
  });

  it("converts little-endian PCM16 to Float32 samples", () => {
    const bytes = new Uint8Array([0, 128, 0, 0, 255, 127]);
    const samples = decodePcm16ToFloat32(bytes);

    assert.equal(samples.length, 3);
    assert.equal(samples[0], -1);
    assert.equal(samples[1], 0);
    assert.ok(samples[2] > 0.99);
  });

  it("uses Qwen realtime output sample rate", () => {
    assert.equal(QWEN_OUTPUT_SAMPLE_RATE, 24000);
  });

  it("queues and consumes audio deltas in order", () => {
    let state = reducePlaybackQueue({ queue: [], status: "idle" }, {
      type: "enqueue",
      item: { encoding: "pcm/base64", data: "AQID" },
    });
    state = reducePlaybackQueue(state, {
      type: "enqueue",
      item: { encoding: "pcm/base64", data: "BAUG" },
    });
    state = reducePlaybackQueue(state, { type: "consume" });

    assert.deepEqual(state.queue.map((item) => item.data), ["BAUG"]);
    assert.equal(state.status, "playing");
  });
});
