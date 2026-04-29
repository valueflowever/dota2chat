import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/analyze/route";

describe("POST /api/analyze", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          matchId?: string;
          focusQuestion: string;
        };
        const isReplay = Boolean(body.matchId?.trim());

        return Response.json({
          conversation: {
            mode: isReplay ? "match-replay" : "game-question",
            title: isReplay ? `比赛 ${body.matchId}` : "游戏问题",
            summary: "快速结论",
            messages: [
              {
                id: "user-entry",
                role: "user",
                content: body.matchId || body.focusQuestion,
              },
              {
                id: "assistant-entry",
                role: "assistant",
                content: "先说结论：测试回答",
              },
            ],
            followUps: [
              { question: "追问 1", answer: "回答 1" },
              { question: "追问 2", answer: "回答 2" },
              { question: "追问 3", answer: "回答 3" },
            ],
            source: "demo-engine",
            generatedAt: new Date().toISOString(),
          },
        });
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

    const payload = await response.json();

    expect(payload.conversation.mode).toBe("match-replay");
    expect(payload.conversation.messages).toHaveLength(2);
    expect(payload.conversation.followUps.length).toBeGreaterThanOrEqual(3);
    expect(payload.conversation.source).toBeTruthy();
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

    const payload = await response.json();

    expect(payload.conversation.mode).toBe("game-question");
    expect(payload.conversation.messages[1].content).toContain("先说结论");
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
