import { getDemoMatchLocalAnalysis } from "@/lib/analysis/demo-match-registry";
import type {
  AnalysisAudience,
  AnalysisReport,
  AnalysisRequest,
  TimelineTag,
} from "@/lib/analysis/schema";

const issueBlueprints: Record<
  TimelineTag | "default",
  {
    title: string;
    description: string;
    whyItMatters: string;
    nextMove: string;
  }
> = {
  macro: {
    title: "控图节奏断成了单次尝试",
    description:
      "你们的推进、开雾和边线处理没有连成一套节奏，导致每次进危险区域都像孤立决策。",
    whyItMatters:
      "Dota 2 的中期控图不是单次进野区，而是兵线、眼位和站位一起把敌人挤出地图。",
    nextMove: "下次进对方关键野区前，先确认最近两波兵线和补眼点都已经到位。",
  },
  lane: {
    title: "对线优势没有被妥善兑换",
    description:
      "即使线期没有明显崩盘，优势也没有及时转成资源差、塔压或安全视野。",
    whyItMatters: "线优如果不能换成地图资源，后续团战仍然会回到五五开甚至劣势。",
    nextMove: "把线优后的第一个动作固定成补线、压塔或控符，而不是立刻盲目追击。",
  },
  teamfight: {
    title: "团战入场层次不一致",
    description:
      "前后排和关键技能的进入节奏没有叠在一起，导致核心输出窗口被自己切碎了。",
    whyItMatters: "很多看似打不过的团，其实输在阵型被拆开，而不是纯数值打不过。",
    nextMove: "复盘时先定义第一接触点和第二波跟进点，避免所有人同时冲同一个入口。",
  },
  objective: {
    title: "目标物决策缺少前置布置",
    description:
      "Roshan、二塔或野区入口的争夺缺少提前 15-25 秒的边线与视野预备动作。",
    whyItMatters:
      "没有前置布置时，目标物争夺就会变成临场反应，通常更利于站好位的一方。",
    nextMove: "把每次目标物尝试拆成三步：带线、补眼、站位，再决定是否接团。",
  },
  vision: {
    title: "信息差总是慢半拍",
    description:
      "眼位、扫眼和站位选择没有建立起足够的信息优势，团队只好靠猜测接下一波。",
    whyItMatters: "信息不足会让开雾、守高台和抢肉山全部变成高波动赌注。",
    nextMove: "每次关键烟雾前先回答一个问题：我们下一分钟最需要看到哪块地图？",
  },
  draft: {
    title: "阵容强势窗口没有被强调",
    description:
      "英雄组合的节奏点和禁忌点没有被明确喊出来，执行时就容易偏成临时碰运气。",
    whyItMatters:
      "阵容理解模糊会让本该主动的阵容打得犹豫，也会让后期阵容被迫硬接中期团。",
    nextMove: "在复盘里明确写出这套阵容的强势分钟段、先手条件和必须避开的区域。",
  },
  economy: {
    title: "资源分配让节奏掉速",
    description:
      "关键英雄的刷钱、补给和 TP 节奏没有协调好，导致每波都有人准备不足。",
    whyItMatters: "经济和时间管理是中期节奏的底板，准备不足会让正确决策也难以执行。",
    nextMove: "复盘时标出每个节奏点前谁必须先补满资源，再讨论要不要接战。",
  },
  default: {
    title: "关键决策没有形成固定流程",
    description:
      "你们已经知道问题大概在哪，但没有把正确动作拆成能重复执行的流程。",
    whyItMatters: "只有把复盘结论变成固定动作，下一局才不会重复踩回同一个坑。",
    nextMove: "把最大的一个问题写成 20 秒口令，并在下一局只盯这一个执行点。",
  },
};

const audienceAddOnCopy: Record<
  AnalysisAudience,
  {
    title: string;
    summary: (focus: string) => string;
    bullets: string[];
  }
> = {
  "solo-player": {
    title: "个人上分视角",
    summary: (focus) =>
      `把这局的复盘浓缩成一个排位任务：优先修正“${focus}”背后的动作顺序，而不是一口气修三件事。`,
    bullets: [
      "下一局开局前先写下唯一复盘目标，避免边打边忘。",
      "每次失败团战后先检查是否漏了前置动作，而不是只怪技能释放。",
      "排位结束后只复看最关键的 2 个时间点，建立连续反馈。",
    ],
  },
  coach: {
    title: "团队复盘视角",
    summary: (focus) =>
      `目标是找出团队协同和地图节奏断点，再把“${focus}”拆成可讨论、可分工、可复现的复盘议题。`,
    bullets: [
      "把每次失败的入口定义成谁喊、谁补线、谁先站位。",
      "优先统一对目标物的前置口令，而不是只讨论结果输赢。",
      "复盘结论必须能回到训练赛里的可执行分工。",
    ],
  },
  creator: {
    title: "内容创作者视角",
    summary: (focus) =>
      `这局最适合包装成“${focus}”如何层层失控的故事线，让观众看懂节奏是怎么一点点断掉的。`,
    bullets: [
      "用一个时间点当钩子，再回放它之前埋下的节奏伏笔。",
      "把最能体现反差的操作和站位错误做成对照剪辑。",
      "旁白尽量用因果链表达，不只报结果。",
    ],
  },
};

function detectPrimaryFocus(input: AnalysisRequest) {
  const text = [
    input.focusQuestion,
    input.contextSummary,
    input.draftSummary,
    input.laneOutcome,
    input.replayNotes,
    input.transcript,
    ...input.timeline.map((event) => `${event.title} ${event.impact}`),
  ]
    .join(" ")
    .toLowerCase();

  if (/(控图|地图主动权|triangle|三角区|smoke|开雾|地图)/.test(text)) {
    return "控图";
  }

  if (/(roshan|肉山|盾|objective)/.test(text)) {
    return "目标物处理";
  }

  if (/(团战|阵型|拉散|fight)/.test(text)) {
    return "团战阵型";
  }

  return "中期节奏";
}

function detectThemes(input: AnalysisRequest) {
  const themes = new Set<TimelineTag>();

  input.timeline.forEach((event) => themes.add(event.tag));

  const combinedText = [
    input.focusQuestion,
    input.contextSummary,
    input.draftSummary,
    input.laneOutcome,
    input.replayNotes,
    input.transcript,
  ].join(" ");

  if (/(控图|地图|三角区|边线|开雾|smoke)/i.test(combinedText)) {
    themes.add("macro");
  }

  if (/(Roshan|肉山|盾|塔|高地)/i.test(combinedText)) {
    themes.add("objective");
  }

  if (/(视野|高台眼|ward|scan|真眼)/i.test(combinedText)) {
    themes.add("vision");
  }

  if (/(站位|阵型|拉散|团战|团控)/i.test(combinedText)) {
    themes.add("teamfight");
  }

  if (/(draft|bp|阵容|silence|沉默)/i.test(combinedText)) {
    themes.add("draft");
  }

  if (!themes.size) {
    themes.add("macro");
    themes.add("teamfight");
  }

  return Array.from(themes);
}

function buildPriorityIssues(input: AnalysisRequest) {
  const themes = detectThemes(input);
  const paddedThemes: Array<TimelineTag | "default"> = [...themes];

  while (paddedThemes.length < 3) {
    paddedThemes.push("default");
  }

  return paddedThemes.slice(0, 3).map((theme, index) => {
    const blueprint = issueBlueprints[theme];
    const moment = input.timeline[index];
    const momentSuffix = moment
      ? `最明显的信号出现在 ${moment.time} 的“${moment.title}”。`
      : "这不是单个时间点的问题，而是一整段流程都没有固定下来。";

    return {
      title: blueprint.title,
      description: `${blueprint.description}${momentSuffix}`,
      whyItMatters: blueprint.whyItMatters,
      nextMove: blueprint.nextMove,
    };
  });
}

function buildPhaseBreakdown(input: AnalysisRequest) {
  const focus = detectPrimaryFocus(input);

  return [
    {
      phase: "对线前 10 分钟",
      verdict: input.laneOutcome || "线期没有被稳定地转成地图收益。",
      takeaways: [
        input.draftSummary || "需要更早确认阵容的第一强势时间窗。",
        "线期信息和符点资源需要更主动地服务后续地图节奏。",
      ],
      winCondition: "把线期拿到的优势换成第一轮塔区与河道信息，而不是只换一波击杀。",
    },
    {
      phase: "10-25 分钟中期",
      verdict: `${focus} 是这局真正断开的地方，执行不像连续节奏，更像一次次临场尝试。`,
      takeaways: [
        input.contextSummary ||
          input.replayNotes ||
          "中期需要先把兵线和站位整理好，再讨论进不进危险区域。",
        "每次关键动作前先确认信息、边线和切入点是不是同频。",
      ],
      winCondition: "把每次开雾、抢盾或压塔前的准备动作标准化。",
    },
    {
      phase: "25 分钟后收束",
      verdict: "后期不是突然崩盘，而是前面没处理好的节奏问题在更高风险区域被放大。",
      takeaways: [
        input.transcript || "沟通里需要提前定义谁做最后拍板。",
        "高风险区域的站位必须围绕关键技能和保人优先级展开。",
      ],
      winCondition: "先用信息和兵线逼出敌方回应，再决定是否接最后一波关键团。",
    },
  ];
}

function buildKeyMoments(input: AnalysisRequest) {
  if (input.timeline.length >= 2) {
    return input.timeline.map((event) => ({
      time: event.time,
      title: event.title,
      whatHappened: `${event.impact}，这说明当时的节奏并没有为这次动作做好承接。`,
      whyItMatters: "单个时间点暴露出来的是流程问题，而不是一次纯粹的操作失误。",
      adjustment: "把这类动作前的补线、补眼和站位口令写成固定流程。",
    }));
  }

  return [
    {
      time: "12:00",
      title: "中期过渡点",
      whatHappened: "节奏从线期转中期时缺少统一的地图目标。",
      whyItMatters: "这个时间段决定后面能不能先手布置目标物。",
      adjustment: "在转线期结束时就确定接下来两分钟要争哪块图。",
    },
    {
      time: "20:00",
      title: "高风险区域接触",
      whatHappened: "进入关键区域时没有形成完整的信息优势。",
      whyItMatters: "这通常是比赛开始摇摆或彻底失控的起点。",
      adjustment: "先拿边线和高台，再决定要不要强接下一波。",
    },
  ];
}

function buildPracticePlan(input: AnalysisRequest) {
  const focus = detectPrimaryFocus(input);
  const themes = detectThemes(input);

  return [
    {
      title: `下一局只盯一个主题：${focus}`,
      duration: "1 局排位",
      steps: [
        "开局前先写一句口令，提醒自己这局最重要的流程是什么。",
        "每次想主动进地图前，先口头确认边线、视野和切入点。",
        "打完后只复看两个最能代表问题的时间点。",
      ],
    },
    {
      title: "把失败团战拆成前置动作",
      duration: "15 分钟复盘",
      steps: [
        "先记录团战前 20 秒做了什么，不要一开始就盯技能释放。",
        "把没做到位的前置动作写成下一局必须先完成的检查项。",
      ],
    },
    {
      title: `围绕 ${themes[0] ?? "节奏"} 做一个固定复盘模板`,
      duration: "10 分钟整理",
      steps: [
        "每局固定记录一个成功时间点和一个失败时间点。",
        "对照看这两个时间点前的兵线、视野和站位差异。",
        "把差异浓缩成一句赛后总结，形成自己的复盘数据库。",
      ],
    },
  ];
}

export async function analyzeReplayLocally(
  input: AnalysisRequest,
): Promise<AnalysisReport> {
  const demoMatchAnalysis = getDemoMatchLocalAnalysis(input.matchId, input.audience);

  if (demoMatchAnalysis) {
    return {
      ...demoMatchAnalysis,
      source: "demo-engine",
      generatedAt: new Date().toISOString(),
    };
  }

  const focus = detectPrimaryFocus(input);
  const issues = buildPriorityIssues(input);

  return {
    source: "demo-engine",
    generatedAt: new Date().toISOString(),
    summary: {
      headline: `${focus} 没有被串成连贯节奏，真正的问题不是单次失误，而是准备动作和进场顺序不断脱节。`,
      overview: `从这份录像上下文看，比赛在中期开始暴露出明显的${focus}问题：你们知道想做什么，但没有把边线、信息和站位连成一个稳定流程。`,
      verdict: "这是一局被流程断点拖慢的比赛，不是单纯输在操作硬实力。",
      confidence:
        input.timeline.length >= 2 && input.transcript.trim() ? "medium" : "low",
    },
    priorityIssues: issues,
    phaseBreakdown: buildPhaseBreakdown(input),
    keyMoments: buildKeyMoments(input),
    practicePlan: buildPracticePlan(input),
    audienceAddOn: {
      title: audienceAddOnCopy[input.audience].title,
      summary: audienceAddOnCopy[input.audience].summary(input.focusQuestion),
      bullets: audienceAddOnCopy[input.audience].bullets,
    },
  };
}
