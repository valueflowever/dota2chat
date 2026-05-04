import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/analyze/route";

describe("POST /api/analyze", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          question: string;
          context?: { match_id?: string | null };
        };
        const answerSeed = body.context?.match_id || body.question;

        return new Response(
          [
            `event: delta`,
            `data: ${JSON.stringify({ text: "先说结论：" })}`,
            "",
            `event: final`,
            `data: ${JSON.stringify({ answer: `测试回答：${answerSeed}` })}`,
            "",
            "event: done",
            "data: {}",
            "",
          ].join("\n"),
          {
            headers: {
              "Content-Type": "text/event-stream",
            },
          },
        );
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a replay conversation for a valid match-style payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          audience: "solo-player",
          matchId: "8724913167",
          focusQuestion: "这局最值得先改什么？",
        }),
      }),
    );

    expect(response.status).toBe(200);

    const payload = await response.text();

    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    expect(payload).toContain("event: delta");
    expect(payload).toContain("测试回答：8724913167");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/chat/stream",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Accept: "text/event-stream",
        }),
      }),
    );
    const backendRequest = JSON.parse(
      String((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]?.body),
    );
    expect(backendRequest.question).toBe("这局最值得先改什么？");
    expect(backendRequest.context.match_id).toBe("8724913167");
    expect(backendRequest.answer_style).toBe("coach");
  });

  it("returns a quick-answer conversation for gameplay questions", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          audience: "solo-player",
          focusQuestion: "火猫中单打蓝猫要注意什么？",
        }),
      }),
    );

    expect(response.status).toBe(200);

    const payload = await response.text();

    expect(payload).toContain("event: final");
    expect(payload).toContain("火猫中单打蓝猫要注意什么");
    const backendRequest = JSON.parse(
      String((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]?.body),
    );
    expect(backendRequest.question).toBe("火猫中单打蓝猫要注意什么？");
    expect(backendRequest.context.match_id).toBeNull();
  });

  it("rejects invalid payloads with field errors", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          audience: "mystery",
          focusQuestion: "",
        }),
      }),
    );

    expect(response.status).toBe(400);

    const payload = await response.json();

    expect(payload.error).toContain("Invalid");
    expect(payload.fieldErrors.audience).toBeTruthy();
    expect(payload.fieldErrors.focusQuestion).toBeTruthy();
  });
});
