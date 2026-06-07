import { NextResponse } from "next/server";
import {
  sendRealtimePracticeAudio,
  sendRealtimePracticeText,
} from "@/lib/realtime-voice-flow/orchestrator.server";
import type { AudioChunkMetadata } from "@/lib/voice-audio-format";

const AUDIO_METADATA_HEADER = "x-audio-chunk-metadata";

function parseAudioMetadata(request: Request, byteLength: number): AudioChunkMetadata {
  const rawMetadata = request.headers.get(AUDIO_METADATA_HEADER);
  if (!rawMetadata) {
    return {
      mimeType: request.headers.get("content-type") ?? "",
      sequence: Number(request.headers.get("x-audio-sequence") ?? 0),
      byteLength,
    };
  }
  const parsed = JSON.parse(rawMetadata) as Partial<AudioChunkMetadata>;
  return {
    mimeType: String(parsed.mimeType ?? ""),
    sequence: Number(parsed.sequence ?? 0),
    durationMs: parsed.durationMs,
    sampleRate: parsed.sampleRate,
    channels: parsed.channels,
    byteLength,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const events = await sendRealtimePracticeText({
        sessionId,
        text: String(body.text ?? "Hello, this is a mock voice turn."),
      });
      return NextResponse.json({ accepted: true, events });
    }
    const bytes = new Uint8Array(await request.arrayBuffer());
    const metadata = parseAudioMetadata(request, bytes.byteLength);
    const result = await sendRealtimePracticeAudio({
      sessionId,
      chunk: bytes,
      metadata,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "realtime_audio_failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 400 },
    );
  }
}
