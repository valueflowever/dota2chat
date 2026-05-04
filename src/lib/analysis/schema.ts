import { z } from "zod";

export const audienceValues = ["solo-player", "coach", "creator"] as const;
export const modeValues = [
  "quick-scan",
  "ranked-coaching",
  "team-review",
  "content-breakdown",
  "deep-thinking",
] as const;
export const toneValues = ["balanced", "direct", "blunt", "broadcast"] as const;
export const conversationModeValues = ["match-replay", "game-question"] as const;
export const playerSideValues = ["", "radiant", "dire"] as const;
export const playerPositionValues = ["", "1", "2", "3", "4", "5"] as const;
export const timelineTagValues = [
  "macro",
  "lane",
  "teamfight",
  "objective",
  "vision",
  "draft",
  "economy",
] as const;

export type AnalysisAudience = (typeof audienceValues)[number];
export type AnalysisMode = (typeof modeValues)[number];
export type AnalysisConversationMode = (typeof conversationModeValues)[number];
export type PlayerSide = (typeof playerSideValues)[number];
export type PlayerPosition = (typeof playerPositionValues)[number];
export type TimelineTag = (typeof timelineTagValues)[number];

export const timelineEventSchema = z.object({
  time: z.string().trim().min(1, "请输入时间点"),
  title: z.string().trim().min(2, "请输入事件标题"),
  impact: z.string().trim().min(2, "请输入影响说明"),
  tag: z.enum(timelineTagValues).default("macro"),
});

export const analysisRequestSchema = z.object({
  audience: z.enum(audienceValues),
  mode: z.enum(modeValues).default("quick-scan"),
  deepThinking: z.boolean().optional(),
  matchId: z.string().trim().max(32).default(""),
  focusQuestion: z.string().trim().min(4, "请写下你最关心的问题"),
  contextSummary: z.string().trim().max(2000).default(""),
  skillBracket: z.string().trim().max(60).default(""),
  role: z.string().trim().max(60).default(""),
  playerSide: z.enum(playerSideValues).default(""),
  playerPosition: z.enum(playerPositionValues).default(""),
  lane: z.string().trim().max(60).default(""),
  matchTitle: z.string().trim().max(120).default(""),
  patch: z.string().trim().max(32).default(""),
  draftSummary: z.string().trim().max(800).default(""),
  laneOutcome: z.string().trim().max(400).default(""),
  replayNotes: z.string().trim().max(1600).default(""),
  transcript: z.string().trim().max(2200).default(""),
  desiredTone: z.enum(toneValues).default("balanced"),
  timeline: z.array(timelineEventSchema).max(12, "最多添加 12 个时间点").default([]),
});

const summarySchema = z.object({
  headline: z.string(),
  overview: z.string(),
  verdict: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
});

const priorityIssueSchema = z.object({
  title: z.string(),
  description: z.string(),
  whyItMatters: z.string(),
  nextMove: z.string(),
});

const phaseBreakdownSchema = z.object({
  phase: z.string(),
  verdict: z.string(),
  takeaways: z.array(z.string()).min(2),
  winCondition: z.string(),
});

const keyMomentSchema = z.object({
  time: z.string(),
  title: z.string(),
  whatHappened: z.string(),
  whyItMatters: z.string(),
  adjustment: z.string(),
});

const practiceItemSchema = z.object({
  title: z.string(),
  duration: z.string(),
  steps: z.array(z.string()).min(2),
});

const audienceAddOnSchema = z.object({
  title: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()).min(2),
});

export const analysisReportPayloadSchema = z.object({
  summary: summarySchema,
  priorityIssues: z.array(priorityIssueSchema).min(3).max(3),
  phaseBreakdown: z.array(phaseBreakdownSchema).min(3).max(3),
  keyMoments: z.array(keyMomentSchema).min(2),
  practicePlan: z.array(practiceItemSchema).min(3),
  audienceAddOn: audienceAddOnSchema,
});

export const analysisReportSchema = analysisReportPayloadSchema.extend({
  source: z.enum(["live-ai", "demo-engine"]),
  generatedAt: z.string(),
});

const conversationMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1),
  deepThinking: z.boolean().optional(),
  pending: z.boolean().optional(),
});

const conversationFollowUpSchema = z.object({
  question: z.string().trim().min(1),
  answer: z.string(),
});

export const analysisConversationSchema = z.object({
  mode: z.enum(conversationModeValues),
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  messages: z.array(conversationMessageSchema).min(2),
  followUps: z.array(conversationFollowUpSchema).max(6),
  source: z.enum(["live-ai", "demo-engine"]),
  generatedAt: z.string(),
});

export const replayPreparationSchema = z.object({
  job_id: z.string(),
  match_id: z.string(),
  status: z.string(),
  detail: z.string(),
  error: z.string().nullable().optional(),
});

export const matchSummarySchema = z.object({
  match_id: z.string(),
  title: z.string(),
  duration_seconds: z.number().nullable().optional(),
  duration_text: z.string().default(""),
  start_time: z.number().nullable().optional(),
  winner: z.string().nullable().optional(),
  radiant_score: z.number().nullable().optional(),
  dire_score: z.number().nullable().optional(),
  radiant_team: z.string().default("Radiant"),
  dire_team: z.string().default("Dire"),
  radiant_lineup: z.array(z.string()).default([]),
  dire_lineup: z.array(z.string()).default([]),
  players: z.array(z.record(z.string(), z.unknown())).default([]),
});

export const deepThinkingRiskWindowSchema = z
  .object({
    startTime: z.number().optional(),
    endTime: z.number().optional(),
    startTimeText: z.string().optional(),
    endTimeText: z.string().optional(),
    winnerProbabilityDelta: z.number().optional(),
    winnerProbabilityDrop: z.number().optional(),
    predictedDurationDeltaSeconds: z.number().optional(),
    riskScore: z.number().optional(),
    perspective: z.string().optional(),
    summary: z.string().optional(),
  })
  .passthrough();

export const deepThinkingInsightSchema = z
  .object({
    status: z.string(),
    available: z.boolean().optional(),
    matchId: z.string().optional(),
    modelName: z.string().optional(),
    summary: z.string().optional(),
    latestTimeText: z.string().optional(),
    latestRadiantWinProb: z.number().optional(),
    latestDireWinProb: z.number().optional(),
    predictedWinnerName: z.string().optional(),
    predictedRemainingSeconds: z.number().optional(),
    riskWindows: z.array(deepThinkingRiskWindowSchema).default([]),
    modelMetrics: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type AnalysisReportPayload = z.infer<typeof analysisReportPayloadSchema>;
export type AnalysisReport = z.infer<typeof analysisReportSchema>;
export type AnalysisConversation = z.infer<typeof analysisConversationSchema>;
export type ReplayPreparation = z.infer<typeof replayPreparationSchema>;
export type MatchSummary = z.infer<typeof matchSummarySchema>;
export type DeepThinkingInsight = z.infer<typeof deepThinkingInsightSchema>;
