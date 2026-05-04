import { z } from "zod";

import type {
  AnalysisConversation,
  AnalysisReport,
  AnalysisRequest,
} from "@/lib/analysis/schema";

export const quickQuestionAnswerSchema = z.object({
  headline: z.string(),
  answer: z.string(),
  takeaways: z.array(z.string()).min(3).max(3),
  pitfalls: z.array(z.string()).min(2).max(3),
  practiceFocus: z.string(),
});

export type QuickQuestionAnswer = z.infer<typeof quickQuestionAnswerSchema>;

function formatOrderedList(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function buildReplayOpeningMessage(report: AnalysisReport) {
  const actions = report.priorityIssues.map(
    (issue, index) => `${index + 1}. ${issue.title}：${issue.nextMove}`,
  );

  return [
    `先说结论：${report.summary.verdict}`,
    `${report.summary.headline}`,
    `${report.summary.overview}`,
    "你先别想着一次修很多，先改下面这 3 件事：",
    formatOrderedList(actions),
  ].join("\n\n");
}

export function buildReplayConversation(
  input: AnalysisRequest,
  report: AnalysisReport,
): AnalysisConversation {
  const title = input.matchId ? `比赛编号 ${input.matchId}` : "比赛复盘";

  return {
    mode: "match-replay",
    title,
    summary: "首轮复盘",
    source: report.source,
    generatedAt: report.generatedAt,
    messages: [
      {
        id: "user-entry",
        role: "user",
        content: input.matchId || input.focusQuestion,
      },
      {
        id: "assistant-entry",
        role: "assistant",
        content: buildReplayOpeningMessage(report),
      },
    ],
    followUps: [
      {
        question: "这局为什么会输？",
        answer: [report.summary.verdict, report.summary.overview].join("\n\n"),
      },
      {
        question: "我最大的失误是什么？",
        answer: [
          `${report.priorityIssues[0]?.title}`,
          report.priorityIssues[0]?.description || "",
          `先改法：${report.priorityIssues[0]?.nextMove || ""}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
      {
        question: "下一把先改什么？",
        answer: [
          `${report.practicePlan[0]?.title || "先固定一个练习主题"}`,
          ...(report.practicePlan[0]?.steps ?? []),
        ].join("\n"),
      },
      {
        question: "有哪些关键时间点？",
        answer: report.keyMoments
          .slice(0, 3)
          .map((moment) => `${moment.time} ${moment.title}：${moment.whyItMatters}`)
          .join("\n"),
      },
    ],
  };
}

function detectQuestionTheme(question: string) {
  const normalized = question.toLowerCase();

  if (/(对线|中单|边路|补刀|换血|solo|打蓝猫|打火猫|打圣堂|打帕克)/.test(normalized)) {
    return {
      headline: "先把对线资源和换血顺序打稳，再谈压制。",
      answer:
        "这类问题最容易犯的错，是一上来就想着拼击杀。多数英雄对线先看兵线、血蓝和符点控制，只要你把这些基础节奏握住，击杀窗口自然会出来。",
      takeaways: [
        "先管住兵线位置，别把自己送到对方最舒服的换血距离里。",
        "关键技能优先用来换资源优势，不要为了看起来凶就空交。",
        "6 级和符点前后是第一波节奏点，提前留状态和 TP。",
      ],
      pitfalls: [
        "把所有爆发一口气交完，结果对面还有反打空间。",
        "线权丢了以后还硬赖线，导致符点和边路支援一起亏。",
        "只盯着单杀，不看兵线和血蓝的成本。",
      ],
      practiceFocus: "先复盘你在前 8 分钟里最常见的一次空技能和一次丢线权。",
    };
  }

  if (/(roshan|肉山|目标|推塔|高地|控图|地图|视野)/.test(normalized)) {
    return {
      headline: "目标点的胜负，通常在接触前 20 秒就已经决定了。",
      answer:
        "无论是 Roshan、推塔还是高地，最常见的问题都不是团战里那一拍按错，而是没把边线、视野和入场顺序准备好。你把前置流程做完整，后面的执行会轻松很多。",
      takeaways: [
        "接目标前先看边线，不要让兵线和人同时掉节奏。",
        "先拿信息，再决定是逼位置、开雾还是直接接团。",
        "进关键区域前把第一拍和第二拍是谁说清楚。",
      ],
      pitfalls: [
        "队伍里每个人都默认别人已经补好线或补好眼。",
        "一看到机会就硬接，结果阵型和技能层次都没对齐。",
        "打完一波还留在危险区域，没有及时重置。",
      ],
      practiceFocus: "下次复盘时只看一次目标点前 20 秒，按边线、视野、站位三个维度拆开。",
    };
  }

  if (/(团战|打团|阵容|bp|选人|克制|英雄池)/.test(normalized)) {
    return {
      headline: "先搞清楚阵容想怎么赢，再谈细节操作。",
      answer:
        "多数团战或 BP 问题，核心不是谁操作更好，而是谁更清楚自己这套阵容的强势时段、先手条件和绝对不能乱打的区域。方向清楚了，执行才有意义。",
      takeaways: [
        "先写清楚你们这套阵容的第一赢法和第二赢法。",
        "团战时把先手、保护和收割三层职责分清楚。",
        "只在自己强势窗口主动提节奏，别把弱势期打成硬拼局。",
      ],
      pitfalls: [
        "阵容本该拉扯，却总想正面撞第一拍。",
        "每个人都想当主角，结果关键技能重叠或断层。",
      ],
      practiceFocus: "赛后先写一句话总结阵容赢法，再去看团战回放。",
    };
  }

  return {
    headline: "先把问题缩成一个可执行原则，再决定细节。",
    answer:
      "泛游戏性问题最怕一下子想修十件事。更好的做法是先抓最影响胜率的那个原则，围绕它看节奏、资源和执行，答案会清楚很多。",
    takeaways: [
      "先定义你最想提升的是对线、节奏、目标点还是团战。",
      "每次复盘只抓一个重复出现的问题，不要东修一下西补一下。",
      "把结论写成下一把能照着做的一句口令。",
    ],
    pitfalls: [
      "问题问得很大，但没有落到一个具体场景里。",
      "复盘只看结果，不拆前置流程和决策顺序。",
    ],
    practiceFocus: "下一把结束后，只记录一个成功片段和一个失败片段做对照。",
  };
}

export function buildQuickQuestionAnswer(input: AnalysisRequest): QuickQuestionAnswer {
  return detectQuestionTheme(input.focusQuestion);
}

export function buildQuickQuestionConversation(
  input: AnalysisRequest,
  answer: QuickQuestionAnswer,
  source: AnalysisConversation["source"],
): AnalysisConversation {
  return {
    mode: "game-question",
    title: "游戏问题",
    summary: "快速结论",
    source,
    generatedAt: new Date().toISOString(),
    messages: [
      {
        id: "user-entry",
        role: "user",
        content: input.focusQuestion,
      },
      {
        id: "assistant-entry",
        role: "assistant",
        content: [
          `先说结论：${answer.headline}`,
          answer.answer,
          "你先抓这 3 个点：",
          formatOrderedList(answer.takeaways),
        ].join("\n\n"),
      },
    ],
    followUps: [
      {
        question: "给我三个要点",
        answer: formatOrderedList(answer.takeaways),
      },
      {
        question: "有哪些常见误区？",
        answer: formatOrderedList(answer.pitfalls),
      },
      {
        question: "训练时先盯什么？",
        answer: answer.practiceFocus,
      },
    ],
  };
}
