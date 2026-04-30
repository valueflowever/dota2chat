import { describe, expect, it } from "vitest";

import { analysisRequestSchema } from "@/lib/analysis/schema";

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
