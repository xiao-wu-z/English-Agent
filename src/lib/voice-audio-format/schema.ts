import { z } from "zod";

export const AUDIO_FORMAT_ERROR_CODES = [
  "unsupported_audio_format",
  "audio_encoding_failed",
  "audio_metadata_missing",
] as const;

export const audioFormatErrorCodeSchema = z.enum(AUDIO_FORMAT_ERROR_CODES);

export const audioChunkMetadataSchema = z.object({
  mimeType: z.string().min(1),
  sequence: z.number().int().min(0),
  durationMs: z.number().int().positive().optional(),
  sampleRate: z.number().int().positive().optional(),
  channels: z.number().int().positive().optional(),
  byteLength: z.number().int().min(0),
}).strict();

export type AudioFormatErrorCode = z.infer<typeof audioFormatErrorCodeSchema>;
export type AudioChunkMetadata = z.infer<typeof audioChunkMetadataSchema>;

export type AudioFormatError = {
  code: AudioFormatErrorCode;
  message: string;
};

export function createAudioFormatError(
  code: AudioFormatErrorCode,
  detail: string,
): AudioFormatError {
  return {
    code,
    message: `${code}: ${detail}`,
  };
}
