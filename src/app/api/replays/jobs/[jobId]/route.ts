import { NextResponse } from "next/server";

const backendUrl = process.env.DOTA2_BACKEND_URL ?? "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;

  if (!jobId.trim()) {
    return NextResponse.json({ error: "Replay job id is required." }, { status: 400 });
  }

  let backendResponse: Response;

  try {
    backendResponse = await fetch(`${backendUrl}/api/v1/replays/jobs/${encodeURIComponent(jobId)}`, {
      method: "GET",
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "录像解析状态服务暂时不可用。" },
      { status: 502 },
    );
  }

  const result = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    return NextResponse.json(result ?? { error: "录像解析状态查询失败。" }, { status: backendResponse.status });
  }

  return NextResponse.json(result);
}
