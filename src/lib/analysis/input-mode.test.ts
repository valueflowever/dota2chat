import { describe, expect, it } from "vitest";

import { detectAnalysisInput } from "@/lib/analysis/input-mode";

describe("detectAnalysisInput", () => {
  it("treats a numeric replay id as match mode", () => {
    expect(detectAnalysisInput(" 8724913167 ")).toEqual({
      mode: "match-replay",
      normalizedValue: "8724913167",
    });
  });

  it("treats natural-language gameplay questions as quick-answer mode", () => {
    expect(detectAnalysisInput("火猫中单打蓝猫要注意什么？")).toEqual({
      mode: "game-question",
      normalizedValue: "火猫中单打蓝猫要注意什么？",
    });
  });
});
