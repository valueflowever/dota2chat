import { describe, expect, it } from "vitest";

import { buildAnalysisPrompt } from "@/lib/analysis/prompts";
import type { AnalysisRequest } from "@/lib/analysis/schema";

const request: AnalysisRequest = {
  audience: "solo-player",
  mode: "quick-scan",
  matchId: "8123456789",
  focusQuestion: "为什么我们在 18 分钟后开始丢失地图主动权？",
  contextSummary:
    "17:50 烟雾抓人失败后，团队开始反复争夺敌方野区入口。22 分钟 Roshan 前站位拉散，Phoenix 大招没人保。",
  skillBracket: "",
  role: "",
  playerSide: "",
  playerPosition: "",
  lane: "",
  matchTitle: "",
  patch: "",
  draftSummary: "",
  laneOutcome: "",
  replayNotes: "",
  transcript: "",
  desiredTone: "direct",
  timeline: [
    {
      time: "18:40",
      title: "Smoke 失败",
      impact: "三角区控制权丢失",
      tag: "macro",
    },
    {
      time: "22:05",
      title: "Roshan 前站位拉散",
      impact: "Phoenix 大招没人保",
      tag: "teamfight",
    },
  ],
};

describe("buildAnalysisPrompt", () => {
  it("includes the minimal replay brief without forcing empty advanced fields", () => {
    const prompt = buildAnalysisPrompt(request);

    expect(prompt.system).toContain("Dota 2 replay analysis agent");
    expect(prompt.system).toContain("solo ranked player");
    expect(prompt.system).toContain("Never pretend you saw details");
    expect(prompt.user).toContain("Context Summary");
    expect(prompt.user).toContain("18:40");
    expect(prompt.user).toContain("8123456789");
    expect(prompt.user).toContain("为什么我们在 18 分钟后开始丢失地图主动权");
    expect(prompt.user).toContain("Roshan");
    expect(prompt.user).not.toContain("Role:");
  });

  it("changes its priorities for creator mode", () => {
    const prompt = buildAnalysisPrompt({
      ...request,
      audience: "creator",
      mode: "content-breakdown",
    });

    expect(prompt.system).toContain("content creator");
    expect(prompt.system).toContain("storyline");
    expect(prompt.system).not.toContain("solo ranked player");
  });

  it("passes player side and position as structured context when selected", () => {
    const prompt = buildAnalysisPrompt({
      ...request,
      playerSide: "dire",
      playerPosition: "4",
    });

    expect(prompt.user).toContain("Player Side: Dire / 夜魇");
    expect(prompt.user).toContain("Player Position: 4号位");
  });
});
