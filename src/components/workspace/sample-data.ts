import type {
  AnalysisAudience,
  AnalysisMode,
  AnalysisRequest,
} from "@/lib/analysis/schema";
import { match8724913167AudienceRequests } from "@/lib/analysis/demo-match-8724913167";

export const audienceCards: Record<
  AnalysisAudience,
  {
    label: string;
    title: string;
    description: string;
  }
> = {
  "solo-player": {
    label: "单排玩家",
    title: "排位视角",
    description: "先找最大问题，再给你下一局能马上执行的修正动作。",
  },
  coach: {
    label: "团队教练",
    title: "团队视角",
    description: "把节奏断点翻成可讨论、可分工、可训练的复盘结论。",
  },
  creator: {
    label: "内容创作者",
    title: "内容视角",
    description: "提炼故事线、转折点和可直接进入脚本的分析角度。",
  },
};

export const modeCards: Record<
  AnalysisMode,
  {
    label: string;
    description: string;
  }
> = {
  "quick-scan": {
    label: "快速扫描",
    description: "先抓最大问题，适合先看结论。",
  },
  "ranked-coaching": {
    label: "排位训练",
    description: "更强调个人习惯和下局修正动作。",
  },
  "team-review": {
    label: "团队复盘",
    description: "更强调协同、控图和目标物流程。",
  },
  "content-breakdown": {
    label: "内容拆解",
    description: "更强调叙事、爆点和观众能看懂的因果链。",
  },
};

export const recommendedModeByAudience: Record<AnalysisAudience, AnalysisMode> = {
  "solo-player": "ranked-coaching",
  coach: "team-review",
  creator: "content-breakdown",
};

export const sampleRequests: Record<AnalysisAudience, AnalysisRequest> = {
  "solo-player": match8724913167AudienceRequests["solo-player"],
  coach: match8724913167AudienceRequests.coach,
  creator: match8724913167AudienceRequests.creator,
};

export const defaultDraft: AnalysisRequest = {
  audience: "solo-player",
  mode: "ranked-coaching",
  matchId: "",
  focusQuestion: "",
  contextSummary: "",
  skillBracket: "",
  role: "",
  lane: "",
  matchTitle: "",
  patch: "",
  draftSummary: "",
  laneOutcome: "",
  replayNotes: "",
  transcript: "",
  desiredTone: "balanced",
  timeline: [],
};
