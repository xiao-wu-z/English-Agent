import {
  audioChunkMetadataSchema,
  createAudioFormatError,
  type AudioChunkMetadata,
  type AudioFormatError,
} from "./schema.ts";

export type AudioChunkMetadataValidationResult =
  | {
      ok: true;
      metadata: AudioChunkMetadata;
    }
  | {
      ok: false;
      error: AudioFormatError;
    };

export type AudioForwardingDecision =
  | {
      action: "forward_direct";
      metadata: AudioChunkMetadata;
    }
  | {
      action: "reject";
      error: AudioFormatError;
    };

export function validateAudioChunkMetadata(
  metadata: unknown,
): AudioChunkMetadataValidationResult {
  const parsed = audioChunkMetadataSchema.safeParse(metadata);
  if (!parsed.success) {
    return {
      ok: false,
      error: createAudioFormatError(
        "audio_metadata_missing",
        "audio metadata is missing required fields",
      ),
    };
  }
  return {
    ok: true,
    metadata: parsed.data,
  };
}

export function decideAudioForwarding(
  metadata: unknown,
  acceptedMimeTypes: readonly string[],
): AudioForwardingDecision {
  const validation = validateAudioChunkMetadata(metadata);
  if (!validation.ok) {
    return {
      action: "reject",
      error: validation.error,
    };
  }
  if (validation.metadata.byteLength === 0) {
    return {
      action: "reject",
      error: createAudioFormatError("audio_encoding_failed", "audio chunk is empty"),
    };
  }
  if (!acceptedMimeTypes.includes(validation.metadata.mimeType)) {
    return {
      action: "reject",
      error: createAudioFormatError(
        "unsupported_audio_format",
        "selected browser audio format is not supported by provider",
      ),
    };
  }
  return {
    action: "forward_direct",
    metadata: validation.metadata,
  };
}
