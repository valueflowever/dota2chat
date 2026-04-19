import { NextResponse } from "next/server";

import { analyzeReplay } from "@/lib/analysis/service";
import { analysisRequestSchema } from "@/lib/analysis/schema";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid analysis request",
        fieldErrors: {},
      },
      { status: 400 },
    );
  }

  const parsed = analysisRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid analysis request",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await analyzeReplay(parsed.data);

  return NextResponse.json(result);
}
