import { NextResponse } from "next/server";

import { analysisRequestSchema } from "@/lib/analysis/schema";

const backendUrl = process.env.DOTA2_BACKEND_URL ?? "http://127.0.0.1:8000";

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

  let backendResponse: Response;

  try {
    backendResponse = await fetch(`${backendUrl}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      {
        error: "后端分析服务暂时不可用，请确认 dota2-server 已启动。",
        fieldErrors: {},
      },
      { status: 502 },
    );
  }

  const result = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    return NextResponse.json(
      result ?? {
        error: "后端分析服务请求失败。",
        fieldErrors: {},
      },
      { status: backendResponse.status },
    );
  }

  return NextResponse.json(result);
}
