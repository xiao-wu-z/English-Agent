import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  QWEN_OUTPUT_SAMPLE_RATE,
  decodeBase64ToBytes,
  decodePcm16ToFloat32,
  reducePlaybackQueue,
  schedulePcmPlayback,
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

  it("schedules consecutive PCM chunks without overlapping", () => {
    const first = schedulePcmPlayback({
      currentTime: 10,
      nextStartTime: 0,
      sampleCount: 2400,
      sampleRate: QWEN_OUTPUT_SAMPLE_RATE,
    });
    const second = schedulePcmPlayback({
      currentTime: 10.02,
      nextStartTime: first.endTime,
      sampleCount: 4800,
      sampleRate: QWEN_OUTPUT_SAMPLE_RATE,
    });

    assert.equal(first.startTime, 10);
    assert.equal(first.endTime, 10.1);
    assert.equal(second.startTime, 10.1);
    assert.ok(Math.abs(second.endTime - 10.3) < Number.EPSILON * 10.3);
  });

  it("resets playback scheduling to current time after the queue drains", () => {
    const schedule = schedulePcmPlayback({
      currentTime: 20,
      nextStartTime: 12,
      sampleCount: 2400,
      sampleRate: QWEN_OUTPUT_SAMPLE_RATE,
    });

    assert.equal(schedule.startTime, 20);
    assert.equal(schedule.endTime, 20.1);
  });
});
