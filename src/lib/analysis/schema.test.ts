import { describe, expect, it } from "vitest";

import { analysisConversationSchema, analysisRequestSchema } from "@/lib/analysis/schema";

describe("analysisRequestSchema", () => {
  it("accepts a minimal request and fills sensible defaults", () => {
    const parsed = analysisRequestSchema.parse({
      audience: "solo-player",
      focusQuestion: "为什么 20 分钟后我们突然不会打了？",
    });

    expect(parsed.mode).toBe("quick-scan");
    expect(parsed.matchId).toBe("");
    expect(parsed.contextSummary).toBe("");
    expect(parsed.skillBracket).toBe("");
    expect(parsed.role).toBe("");
    expect(parsed.playerSide).toBe("");
    expect(parsed.playerPosition).toBe("");
    expect(parsed.timeline).toEqual([]);
  });
});

describe("analysisConversationSchema", () => {
  it("allows pending conversations before follow-up suggestions exist", () => {
    const parsed = analysisConversationSchema.parse({
      mode: "game-question",
      title: "新对话",
      summary: "正在生成回答",
      source: "demo-engine",
      generatedAt: "2026-05-04T00:00:00.000Z",
      messages: [
        {
          id: "user-entry",
          role: "user",
          content: "团战应该怎么站位？",
        },
        {
          id: "assistant-pending",
          role: "assistant",
          content: "…",
          pending: true,
        },
      ],
      followUps: [],
    });

    expect(parsed.followUps).toEqual([]);
  });
});
