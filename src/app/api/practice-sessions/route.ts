import { NextResponse } from "next/server";
import { createTextPracticeSession } from "@/lib/text-practice-flow/orchestrator.server";
import { TextPracticeFlowError } from "@/lib/text-practice-flow";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createTextPracticeSession(body);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown) {
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
