import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUDIO_FORMAT_ERROR_CODES,
  decideAudioForwarding,
  selectSupportedMediaRecorderMimeType,
  validateAudioChunkMetadata,
} from "./index.ts";

describe("voice audio format adapter", () => {
  it("selects the first supported preferred MediaRecorder MIME type", () => {
    const selected = selectSupportedMediaRecorderMimeType((mimeType) =>
      mimeType === "audio/ogg;codecs=opus" || mimeType === "audio/mp4",
    );

    assert.deepEqual(selected, {
      supported: true,
      mimeType: "audio/ogg;codecs=opus",
    });
  });

  it("returns a text fallback result when no preferred MIME type is supported", () => {
    const selected = selectSupportedMediaRecorderMimeType(() => false);

    assert.equal(selected.supported, false);
    assert.match(selected.message, /文本练习/);
  });

  it("rejects missing required metadata with audio_metadata_missing", () => {
    const result = validateAudioChunkMetadata({
      mimeType: "audio/webm;codecs=opus",
      byteLength: 128,
    });

    assert.deepEqual(result, {
      ok: false,
      error: {
        code: "audio_metadata_missing",
        message: "audio_metadata_missing: audio metadata is missing required fields",
      },
    });
  });

  it("allows direct forwarding when provider accepts the chunk MIME type", () => {
    const result = decideAudioForwarding(
      {
        mimeType: "audio/webm;codecs=opus",
        sequence: 1,
        byteLength: 128,
      },
      ["audio/webm;codecs=opus"],
    );

    assert.deepEqual(result, {
      action: "forward_direct",
      metadata: {
        mimeType: "audio/webm;codecs=opus",
        sequence: 1,
        byteLength: 128,
      },
    });
  });

  it("rejects unsupported MIME type without exposing raw audio or secrets", () => {
    const result = decideAudioForwarding(
      {
        mimeType: "audio/mp4",
        sequence: 1,
        byteLength: 128,
      },
      ["audio/webm;codecs=opus"],
    );

    assert.equal(result.action, "reject");
    assert.equal(result.error.code, "unsupported_audio_format");
    assert.doesNotMatch(JSON.stringify(result), /sk-|Authorization|rawAudio|bytes|chunk/i);
  });

  it("rejects empty chunks before forwarding", () => {
    const result = decideAudioForwarding(
      {
        mimeType: "audio/webm;codecs=opus",
        sequence: 1,
        byteLength: 0,
      },
      ["audio/webm;codecs=opus"],
    );

    assert.equal(result.action, "reject");
    assert.equal(result.error.code, "audio_encoding_failed");
  });

  it("keeps audio format error codes finite", () => {
    assert.deepEqual(AUDIO_FORMAT_ERROR_CODES, [
      "unsupported_audio_format",
      "audio_encoding_failed",
      "audio_metadata_missing",
    ]);
  });
});
