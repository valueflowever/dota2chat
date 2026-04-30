import { describe, expect, it } from "vitest";

import { match8724913167AudienceRequests } from "@/lib/analysis/demo-match-8724913167";
import { analyzeReplayLocally } from "@/lib/analysis/local-engine";
import type { AnalysisRequest } from "@/lib/analysis/schema";

const request: AnalysisRequest = {
  audience: "coach",
  mode: "team-review",
  matchId: "8123000001",
  focusQuestion: "这把为什么中期控图持续失败？",
  contextSummary:
    "我方每次进对方三角区前都缺少边线压力，导致敌方总能五人先手集结。",
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
  transcript: "比赛中反复提到想开雾，但没有同步补线和守塔节奏。",
  desiredTone: "blunt",
  timeline: [
    {
      time: "16:20",
      title: "边路线没人带",
      impact: "敌方先站三角区高台",
      tag: "macro",
    },
    {
      time: "21:30",
      title: "Roshan 口拉扯失败",
      impact: "阵型被切成两段",
      tag: "objective",
    },
  ],
};

describe("analyzeReplayLocally", () => {
  it("returns a structured report with clear issues, moments, and drills", async () => {
    const report = await analyzeReplayLocally(request);

    expect(report.summary.headline.length).toBeGreaterThan(16);
    expect(report.summary.overview).toContain("控图");
    expect(report.priorityIssues).toHaveLength(3);
    expect(report.keyMoments[0]?.time).toBe("16:20");
    expect(report.practicePlan.length).toBeGreaterThanOrEqual(3);
    expect(report.audienceAddOn.title.length).toBeGreaterThan(0);
  });

  it("marks its source as demo mode", async () => {
    const report = await analyzeReplayLocally(request);

    expect(report.source).toBe("demo-engine");
  });

  it("still produces a useful report from a low-input request", async () => {
    const report = await analyzeReplayLocally({
      audience: "solo-player",
      matchId: "",
      focusQuestion: "这局到底最大的锅在哪？",
      mode: "quick-scan",
      contextSummary: "",
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
      desiredTone: "balanced",
      timeline: [],
    });

    expect(report.priorityIssues).toHaveLength(3);
    expect(report.keyMoments).toHaveLength(2);
    expect(report.summary.confidence).toBe("low");
  });

  it("returns a detailed event-level read for the demo replay sample", async () => {
    const report = await analyzeReplayLocally(
      match8724913167AudienceRequests["solo-player"],
    );

    expect(report.summary.overview).toContain("Roshan");
    expect(report.priorityIssues[0]?.description).toContain("天辉");
    expect(report.priorityIssues[0]?.description).toContain("夜魇");
    expect(report.priorityIssues[0]?.whyItMatters).toContain("领先");
    expect(report.priorityIssues[0]?.nextMove).toContain("止损");
    expect(report.keyMoments[0]?.whatHappened).toContain("16:52");
    expect(report.keyMoments[0]?.whyItMatters).toContain("做错");
    expect(report.keyMoments[0]?.adjustment).toContain("优势");
    expect(report.keyMoments[1]?.adjustment).toContain("劣势");
  });
});
