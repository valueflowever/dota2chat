import { NextResponse } from "next/server";

import { formatPlayerPositionRole } from "@/lib/analysis/player-context";
import { analysisRequestSchema } from "@/lib/analysis/schema";
import type { AnalysisRequest } from "@/lib/analysis/schema";

const backendUrl = process.env.DOTA2_BACKEND_URL ?? "http://127.0.0.1:8000";

function formatPlayerSide(value: AnalysisRequest["playerSide"]) {
  if (value === "radiant") {
    return "天辉";
  }

  if (value === "dire") {
    return "夜魇";
  }

  return "";
}

function formatPlayerPositionForBackend(value: AnalysisRequest["playerPosition"]) {
  const role = formatPlayerPositionRole(value);
  return value && role ? `${value}号位（${role}）` : "";
}

function resolveAnswerStyle(request: AnalysisRequest) {
  if (request.deepThinking || request.mode === "deep-thinking") {
    return "deep-thinking";
  }

  if (request.audience === "creator") {
    return "creator";
  }

  if (request.audience === "coach" || request.mode === "team-review") {
    return "coach";
  }

  return "coach";
}

function buildBackendQuestion(request: AnalysisRequest) {
  const playerContext = [
    formatPlayerSide(request.playerSide),
    formatPlayerPositionForBackend(request.playerPosition),
  ]
    .filter(Boolean)
    .join("，");

  return [
    request.focusQuestion.trim(),
    playerContext ? `玩家视角：${playerContext}` : "",
    request.contextSummary.trim()
      ? `补充上下文：${request.contextSummary.trim()}`
      : "",
    request.draftSummary.trim() ? `阵容/选人：${request.draftSummary.trim()}` : "",
    request.laneOutcome.trim() ? `对线结果：${request.laneOutcome.trim()}` : "",
    request.replayNotes.trim() ? `录像备注：${request.replayNotes.trim()}` : "",
    request.transcript.trim() ? `观察/语音记录：${request.transcript.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildBackendChatRequest(request: AnalysisRequest) {
  const matchId = request.matchId.trim();

  return {
    question: buildBackendQuestion(request),
    context: {
      match_id: matchId || null,
    },
    language: "zh-CN",
    answer_style: resolveAnswerStyle(request),
    deepThinking: Boolean(request.deepThinking),
  };
}

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
    backendResponse = await fetch(`${backendUrl}/api/v1/chat/stream`, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildBackendChatRequest(parsed.data)),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      {
        error: "分析服务暂时不可用。",
        fieldErrors: {},
      },
      { status: 502 },
    );
  }

  if (!backendResponse.ok) {
    const result = await backendResponse.json().catch(() => null);

    return NextResponse.json(
      result ?? {
        error: "后端分析服务请求失败。",
        fieldErrors: {},
      },
      { status: backendResponse.status },
    );
  }

  if (!backendResponse.body) {
    return NextResponse.json(
      {
        error: "后端流式响应为空，请稍后再试。",
        fieldErrors: {},
      },
      { status: 502 },
    );
  }

  return new Response(backendResponse.body, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
