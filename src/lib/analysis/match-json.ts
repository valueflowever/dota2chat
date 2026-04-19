import { z } from "zod";

import type {
  AnalysisAudience,
  AnalysisRequest,
  TimelineEvent,
} from "@/lib/analysis/schema";

const objectiveSchema = z.object({
  time: z.number(),
  type: z.string(),
  key: z.string().nullable().optional(),
});

const playerSchema = z.object({
  player_slot: z.number(),
  personaname: z.string().nullable().optional(),
  isRadiant: z.boolean(),
  hero_id: z.number(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  hero_damage: z.number(),
  tower_damage: z.number(),
  net_worth: z.number(),
});

export const replayMatchJsonSchema = z.object({
  match_id: z.number(),
  radiant_name: z.string().nullable().optional(),
  dire_name: z.string().nullable().optional(),
  radiant_score: z.number(),
  dire_score: z.number(),
  radiant_win: z.boolean(),
  duration: z.number(),
  patch: z.number(),
  objectives: z.array(objectiveSchema),
  players: z.array(playerSchema),
});

export type ReplayMatchJson = z.infer<typeof replayMatchJsonSchema>;

export type MatchProductSeed = {
  matchId: string;
  title: string;
  patchLabel: string;
  contextSummary: string;
  replayNotes: string;
  draftSummary: string;
  laneOutcome: string;
  transcript: string;
  timeline: TimelineEvent[];
  focusQuestions: Record<AnalysisAudience, string>;
};

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatTeamName(name: string | null | undefined, fallback: string) {
  return name?.trim() ? name : fallback;
}

function formatObjectiveTarget(key?: string | null) {
  if (!key) {
    return "关键目标";
  }

  const side = key.includes("goodguys") ? "天辉" : key.includes("badguys") ? "夜魇" : "";
  const lane = key.includes("top")
    ? "上路"
    : key.includes("mid")
      ? "中路"
      : key.includes("bot")
        ? "下路"
        : "";

  if (key.includes("tower1")) {
    return `${side}${lane}一塔`;
  }

  if (key.includes("tower2")) {
    return `${side}${lane}二塔`;
  }

  if (key.includes("tower3")) {
    return `${side}${lane}高地塔`;
  }

  if (key.includes("range_rax")) {
    return `${side}${lane}远程兵营`;
  }

  if (key.includes("melee_rax")) {
    return `${side}${lane}近战兵营`;
  }

  if (key.includes("fort")) {
    return `${side}基地`;
  }

  return key;
}

function buildTimeline(objectives: ReplayMatchJson["objectives"]) {
  const buildingKills = objectives.filter((event) => event.type === "building_kill");
  const roshanKill = objectives.find(
    (event) => event.type === "CHAT_MESSAGE_ROSHAN_KILL",
  );
  const postRoshanPush = roshanKill
    ? buildingKills.find((event) => event.time > roshanKill.time)
    : null;
  const closingObjective = buildingKills.at(-1);
  const earlyObjective = buildingKills[0];

  const timeline: TimelineEvent[] = [];

  if (earlyObjective) {
    timeline.push({
      time: formatClock(earlyObjective.time),
      title: `${formatObjectiveTarget(earlyObjective.key)} 被拔掉`,
      impact: "前中期节奏开始出现明确的地图交换与推进窗口。",
      tag: "objective",
    });
  }

  if (roshanKill) {
    timeline.push({
      time: formatClock(roshanKill.time),
      title: "Roshan 被击杀",
      impact: "这一拍决定了后面高地推进的节奏和能不能一波结束比赛。",
      tag: "objective",
    });
  }

  if (postRoshanPush) {
    timeline.push({
      time: formatClock(postRoshanPush.time),
      title: `${formatObjectiveTarget(postRoshanPush.key)} 被拔掉`,
      impact: "拿盾后的第一波推进很快把优势从资源领先转成了高地压力。",
      tag: "macro",
    });
  }

  if (closingObjective && closingObjective !== postRoshanPush) {
    timeline.push({
      time: formatClock(closingObjective.time),
      title: `${formatObjectiveTarget(closingObjective.key)} 被终结`,
      impact: "比赛在这一波推进中彻底收束，没有再给对手第二次重置节奏的机会。",
      tag: "objective",
    });
  }

  return timeline.slice(0, 4);
}

export function buildMatchProductSeed(raw: unknown): MatchProductSeed {
  const match = replayMatchJsonSchema.parse(raw);
  const radiantName = formatTeamName(match.radiant_name, "天辉");
  const direName = formatTeamName(match.dire_name, "夜魇");
  const winnerName = match.radiant_win ? radiantName : direName;
  const loserName = match.radiant_win ? direName : radiantName;
  const winnerScore = match.radiant_win ? match.radiant_score : match.dire_score;
  const loserScore = match.radiant_win ? match.dire_score : match.radiant_score;
  const timeline = buildTimeline(match.objectives);
  const buildingKills = match.objectives.filter((event) => event.type === "building_kill");
  const roshanKill = match.objectives.find(
    (event) => event.type === "CHAT_MESSAGE_ROSHAN_KILL",
  );
  const towerCarry = [...match.players].sort(
    (left, right) => right.tower_damage - left.tower_damage,
  )[0];
  const damageCarry = [...match.players].sort(
    (left, right) => right.hero_damage - left.hero_damage,
  )[0];

  const contextSummary = [
    `${radiantName} 对阵 ${direName}，最终由 ${winnerName} 以 ${winnerScore}-${loserScore} 拿下比赛，时长 ${formatClock(match.duration)}。`,
    timeline[0]
      ? `${timeline[0].time} 左右出现第一次关键推塔节奏。`
      : "前中期存在明显的地图交换节点。",
    roshanKill
      ? `${formatClock(roshanKill.time)} 的 Roshan 节点之后，比赛节奏明显开始向 ${winnerName} 倾斜。`
      : "比赛没有明显的 Roshan 节奏信息。",
    buildingKills.length
      ? `最后一段推进围绕 ${formatObjectiveTarget(buildingKills.at(-1)?.key)} 的终结展开。`
      : "比赛的终结方式需要继续从录像里补更多目标物信息。",
  ].join("");

  const replayNotes = [
    damageCarry
      ? `${damageCarry.personaname || "一号位"} 打出了全场最高的 ${damageCarry.hero_damage} 英雄伤害。`
      : null,
    towerCarry
      ? `${towerCarry.personaname || "推进核心"} 贡献了 ${towerCarry.tower_damage} 拆塔伤害，是终结推进的重要执行点。`
      : null,
  ]
    .filter(Boolean)
    .join("");

  return {
    matchId: String(match.match_id),
    title: `${radiantName} vs ${direName}`,
    patchLabel: `Patch ${match.patch}`,
    contextSummary,
    replayNotes,
    draftSummary: `${winnerName} 在关键目标物后的推进转换更干净，${loserName} 虽然有前中期主动权，但没有把领先稳定滚成终结节奏。`,
    laneOutcome:
      damageCarry && damageCarry.isRadiant !== match.radiant_win
        ? `高输出核心一度把比赛拖住，但团队没能把个人优势转成稳定的地图控制。`
        : `两边前中期都能找到推进窗口，但后续把优势转成高地与兵营的效率差距很大。`,
    transcript:
      "建议重点复看 Roshan 前后的站位、推塔承接和高地终结流程，这几段最能解释比赛为什么会突然收束。",
    timeline,
    focusQuestions: {
      "solo-player": "为什么前中期拿到优势后，还是会在 Roshan 后被一波收掉？",
      coach: "这场比赛为什么在第二次关键目标物后，节奏会直接断成一波终结？",
      creator: "这局最适合剪成怎样的反转故事线，才能让观众看懂节奏是怎么翻过去的？",
    },
  };
}

export function buildAudienceRequestFromMatchSeed(
  seed: MatchProductSeed,
  audience: AnalysisAudience,
): AnalysisRequest {
  return {
    audience,
    mode:
      audience === "solo-player"
        ? "ranked-coaching"
        : audience === "coach"
          ? "team-review"
          : "content-breakdown",
    matchId: seed.matchId,
    focusQuestion: seed.focusQuestions[audience],
    contextSummary: seed.contextSummary,
    skillBracket: audience === "coach" ? "Team Review" : "",
    role:
      audience === "solo-player"
        ? "core perspective"
        : audience === "coach"
          ? "captain / coach"
          : "analyst",
    lane: audience === "creator" ? "storyline" : "macro",
    matchTitle: seed.title,
    patch: seed.patchLabel,
    draftSummary: seed.draftSummary,
    laneOutcome: seed.laneOutcome,
    replayNotes: seed.replayNotes,
    transcript: seed.transcript,
    desiredTone:
      audience === "solo-player"
        ? "direct"
        : audience === "coach"
          ? "blunt"
          : "broadcast",
    timeline: seed.timeline,
  };
}
