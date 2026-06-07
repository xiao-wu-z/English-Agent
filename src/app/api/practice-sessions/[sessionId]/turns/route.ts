import { NextResponse } from "next/server";
import {
  submitTextPracticeTurn,
} from "@/lib/text-practice-flow/orchestrator.server";
import { TextPracticeFlowError } from "@/lib/text-practice-flow";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const body = await request.json();
    const result = await submitTextPracticeTurn({
      sessionId,
      userText: String(body.userText ?? ""),
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TextPracticeFlowError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      {
        error: {
          code: "internal_error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    );
  }
}
