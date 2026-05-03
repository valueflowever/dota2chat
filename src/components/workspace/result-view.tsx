"use client";

import { AlertCircle, Check, ChevronRight, Copy, Pencil, SendHorizontal, Sparkles, Square, X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  AnalysisConversation,
  AnalysisRequest,
  DeepThinkingInsight,
  MatchSummary,
  ReplayPreparation,
} from "@/lib/analysis/schema";

const INPUT_MAX_HEIGHT_PX = 180;
const EDIT_MAX_HEIGHT_PX = 320;
const FOLLOW_UP_CONTEXT_MAX_LENGTH = 1900;
const EXISTING_CONTEXT_MAX_LENGTH = 360;
const MESSAGE_CONTEXT_MAX_LENGTH = 220;

const baseModeByAudience: Record<
  AnalysisRequest["audience"],
  AnalysisRequest["mode"]
> = {
  "solo-player": "ranked-coaching",
  coach: "team-review",
  creator: "content-breakdown",
};

function renderInlineSegments(text: string, keyPrefix: string): ReactNode {
  if (!text) {
    return null;
  }

  const segments: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`|(\b\d{1,2}:\d{2}\b)/g;
  let cursor = 0;
  let counter = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      segments.push(text.slice(cursor, match.index));
    }

    if (match[1]) {
      segments.push(
        <strong
          key={`${keyPrefix}-b-${counter++}`}
          className="analysis-chat-strong"
        >
          {match[1]}
        </strong>,
      );
    } else if (match[2]) {
      segments.push(
        <code
          key={`${keyPrefix}-c-${counter++}`}
          className="analysis-chat-inline-code"
        >
          {match[2]}
        </code>,
      );
    } else if (match[3]) {
      segments.push(
        <span
          key={`${keyPrefix}-t-${counter++}`}
          className="analysis-chat-time-tag"
        >
          {match[3]}
        </span>,
      );
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    segments.push(text.slice(cursor));
  }

  return segments;
}

function renderAssistantContent(content: string): ReactNode {
  const blocks = content.split(/\n{2,}/).filter((block) => block.trim().length > 0);

  if (blocks.length === 0) {
    return (
      <p className="analysis-chat-paragraph">
        {renderInlineSegments(content, "single")}
      </p>
    );
  }

  return blocks.map((block, blockIndex) => {
    const lines = block.split("\n");
    const orderedListMatch =
      lines.length > 1 && lines.every((line) => /^\s*\d+\.\s+/.test(line));
    const unorderedListMatch =
      lines.length > 1 && lines.every((line) => /^\s*[-*]\s+/.test(line));

    if (orderedListMatch) {
      return (
        <ol key={`block-${blockIndex}`} className="analysis-chat-list analysis-chat-list-ordered">
          {lines.map((line, lineIndex) => (
            <li key={`block-${blockIndex}-li-${lineIndex}`}>
              {renderInlineSegments(
                line.replace(/^\s*\d+\.\s+/, ""),
                `b${blockIndex}-l${lineIndex}`,
              )}
            </li>
          ))}
        </ol>
      );
    }

    if (unorderedListMatch) {
      return (
        <ul key={`block-${blockIndex}`} className="analysis-chat-list">
          {lines.map((line, lineIndex) => (
            <li key={`block-${blockIndex}-li-${lineIndex}`}>
              {renderInlineSegments(
                line.replace(/^\s*[-*]\s+/, ""),
                `b${blockIndex}-l${lineIndex}`,
              )}
            </li>
          ))}
        </ul>
      );
    }

    const paragraphChildren: ReactNode[] = [];
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        paragraphChildren.push(<br key={`block-${blockIndex}-br-${lineIndex}`} />);
      }
      paragraphChildren.push(
        renderInlineSegments(line, `b${blockIndex}-l${lineIndex}`),
      );
    });

    return (
      <p key={`block-${blockIndex}`} className="analysis-chat-paragraph">
        {paragraphChildren}
      </p>
    );
  });
}

type ResultViewProps = {
  request: AnalysisRequest;
  conversation: AnalysisConversation;
  warning?: string;
  replayJob?: ReplayPreparation | null;
  matchSummary?: MatchSummary | null;
  deepThinking?: DeepThinkingInsight | null;
  onConversationChange?: (
    conversation: AnalysisConversation,
    warning?: string,
    meta?: ResultMetaUpdate,
  ) => void;
};

type ResultMetaUpdate = {
  replayJob?: ReplayPreparation | null;
  matchSummary?: MatchSummary | null;
  deepThinking?: DeepThinkingInsight | null;
};

type ReplayJobStatusPayload = {
  job: ReplayPreparation;
  matchSummary?: MatchSummary | null;
};

function buildConversationTitle(
  request: AnalysisRequest,
  conversation: AnalysisConversation,
) {
  const title = conversation.title.trim();

  if (title) {
    return title;
  }

  if (request.matchId.trim()) {
    return `比赛 ${request.matchId.trim()}`;
  }

  return "本局复盘";
}

function buildConversationSummary(conversation: AnalysisConversation) {
  const summary = conversation.summary.trim();

  if (summary) {
    return summary;
  }

  return conversation.mode === "match-replay"
    ? "围绕这场对局继续追问关键镜头、节奏断点和下一把最值得先改的地方。"
    : "继续把这个问题拆细，先抓结论，再把细节追到底。";
}

function formatGeneratedAt(value: string) {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function formatLineup(lineup?: string[]) {
  const names = (lineup ?? []).filter((name) => name.trim().length > 0);
  return names.length ? names.join(" / ") : "阵容待同步";
}

function formatWinner(summary: MatchSummary) {
  if (summary.winner === "radiant") {
    return `${summary.radiant_team} 获胜`;
  }

  if (summary.winner === "dire") {
    return `${summary.dire_team} 获胜`;
  }

  return "胜负待同步";
}

function formatPlayerSideContext(side: AnalysisRequest["playerSide"]) {
  if (side === "radiant") {
    return "天辉";
  }

  if (side === "dire") {
    return "夜魇";
  }

  return "";
}

function formatPlayerPositionContext(position: AnalysisRequest["playerPosition"]) {
  return position ? `${position}号位` : "";
}

function resolveThinkingRequestMode(
  request: AnalysisRequest,
  thinkingEnabled: boolean,
): AnalysisRequest["mode"] {
  if (thinkingEnabled) {
    return "deep-thinking";
  }

  return request.mode === "deep-thinking"
    ? baseModeByAudience[request.audience]
    : request.mode;
}

function formatReplayJobDetail(job: ReplayPreparation) {
  if (job.status === "queued") {
    return "已加入解析队列，系统会自动下载并解析录像。";
  }

  if (job.status === "running") {
    return "正在下载或解析录像，完成后会同步比赛摘要。";
  }

  if (job.status === "completed") {
    return "录像解析已完成，现在可以重新分析并读取完整录像数据。";
  }

  if (job.status === "failed") {
    return formatReplayJobFailure(job.error);
  }

  return job.detail;
}

function formatReplayJobFailure(error?: string | null) {
  const normalizedError = (error ?? "").toLowerCase();

  if (normalizedError.includes("parser is not running")) {
    return "录像解析器服务未启动。请先启动 OpenDota parser，或在后端 .env 设置 DOTA2_AUTO_START_PARSER=true 后重启后端，再重新解析这场比赛。";
  }

  if (normalizedError.includes("docker daemon")) {
    return "Docker 服务未启动，无法自动拉起 OpenDota parser。请先启动 Docker Desktop 后重试。";
  }

  if (normalizedError.includes("parser request failed")) {
    return "录像解析器请求失败。请确认 OpenDota parser 正在运行，并且 DOTA2_PARSER_URL 指向正确地址。";
  }

  return "录像解析失败，请稍后重试或检查后端服务。";
}

function formatProbability(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatMinuteAmount(seconds?: number | null) {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) {
    return "-";
  }

  return `${(Math.abs(seconds) / 60).toFixed(1)} 分钟`;
}

function formatSignedPointDelta(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)} pp`;
}

function DeepThinkingPanel({ insight }: { insight: DeepThinkingInsight }) {
  const riskWindows = insight.riskWindows?.slice(0, 3) ?? [];
  const ready = insight.status === "ready";

  return (
    <section
      className={`deep-thinking-card ${
        ready ? "deep-thinking-card-ready" : "deep-thinking-card-muted"
      }`}
      aria-label="深度思考模型"
    >
      <div className="deep-thinking-card-head">
        <span className="deep-thinking-card-title">
          <Sparkles size={14} aria-hidden="true" />
          深度思考
        </span>
        <span className="deep-thinking-card-status">
          {ready ? "模型已接入" : insight.status}
        </span>
      </div>

      {insight.summary ? (
        <p className="deep-thinking-card-summary">{insight.summary}</p>
      ) : null}

      {ready ? (
        <>
          <div className="deep-thinking-metrics">
            <span>
              Radiant <strong>{formatProbability(insight.latestRadiantWinProb)}</strong>
            </span>
            <span>
              Dire <strong>{formatProbability(insight.latestDireWinProb)}</strong>
            </span>
            <span>
              剩余 <strong>{formatMinuteAmount(insight.predictedRemainingSeconds)}</strong>
            </span>
          </div>

          {riskWindows.length ? (
            <div className="deep-thinking-windows">
              {riskWindows.map((window, index) => (
                <div
                  key={`${window.startTimeText ?? index}-${window.endTimeText ?? index}`}
                  className="deep-thinking-window"
                >
                  <span className="deep-thinking-window-time">
                    {window.startTimeText ?? "-"}-{window.endTimeText ?? "-"}
                  </span>
                  <span className="deep-thinking-window-detail">
                    胜率 {formatSignedPointDelta(window.winnerProbabilityDelta)}
                    {" / "}
                    时长 {formatMinuteAmount(window.predictedDurationDeltaSeconds)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function isReplayJobStatusActive(status?: string | null) {
  return status === "queued" || status === "running";
}

function isReplayJobActive(job?: ReplayPreparation | null) {
  return isReplayJobStatusActive(job?.status);
}

type ReplayProgressStepStatus = "pending" | "active" | "done" | "failed";

const REPLAY_PROGRESS_STEPS: Array<{ key: string; label: string; caption: string }> = [
  { key: "queue", label: "排队等待", caption: "服务器接受任务并排入处理队列" },
  { key: "parse", label: "解析录像事件", caption: "下载录像并提取关键时间点" },
  { key: "report", label: "生成复盘报告", caption: "整合数据，输出结构化分析" },
];

function deriveReplayStepStatus(
  jobStatus: string,
  stepIndex: number,
): ReplayProgressStepStatus {
  if (jobStatus === "queued") {
    if (stepIndex === 0) return "active";
    return "pending";
  }

  if (jobStatus === "running") {
    if (stepIndex === 0) return "done";
    if (stepIndex === 1) return "active";
    return "pending";
  }

  if (jobStatus === "completed") {
    if (stepIndex === 2) return "active";
    return "done";
  }

  if (jobStatus === "failed") {
    if (stepIndex === 0) return "done";
    if (stepIndex === 1) return "failed";
    return "pending";
  }

  return stepIndex === 0 ? "active" : "pending";
}

function ReplayProgressCard({ job }: { job: ReplayPreparation }) {
  const failed = job.status === "failed";
  const completed = job.status === "completed";
  const headline = failed
    ? "解析失败"
    : completed
      ? "解析完成"
      : "录像处理中";
  const subline = failed
    ? "请稍后重试，或检查后端服务状态"
    : completed
      ? "正在加载完整复盘"
      : "预计 1-3 分钟，可保持页面打开";

  return (
    <section
      className={`replay-progress-card ${
        failed ? "replay-progress-card-failed" : ""
      }`}
      aria-label="录像处理进度"
      aria-live="polite"
    >
      <header className="replay-progress-head">
        <span className="replay-progress-headline">
          {failed ? (
            <AlertCircle size={14} aria-hidden="true" />
          ) : (
            <span className="replay-progress-spinner" aria-hidden="true" />
          )}
          <span>{headline}</span>
        </span>
        <span className="replay-progress-subline">{subline}</span>
      </header>

      <ol className="replay-progress-steps">
        {REPLAY_PROGRESS_STEPS.map((step, index) => {
          const status = deriveReplayStepStatus(job.status, index);
          return (
            <li
              key={step.key}
              className={`replay-progress-step replay-progress-step-${status}`}
              aria-current={status === "active" ? "step" : undefined}
            >
              <span className="replay-progress-step-icon" aria-hidden="true">
                {status === "done" ? (
                  <Check size={12} />
                ) : status === "failed" ? (
                  <AlertCircle size={12} />
                ) : status === "active" ? (
                  <span className="replay-progress-pulse" />
                ) : (
                  <span className="replay-progress-step-index">{index + 1}</span>
                )}
              </span>
              <span className="replay-progress-step-copy">
                <span className="replay-progress-step-label">{step.label}</span>
                <span className="replay-progress-step-caption">{step.caption}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <p className="replay-progress-detail">
        {failed ? formatReplayJobFailure(job.error) : formatReplayJobDetail(job)}
      </p>
    </section>
  );
}

function createTurnId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseStringArrayLiteral(value: string) {
  const trimmed = value.trim();

  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
  } catch {
    // Fall through to Python-style single-quoted list parsing.
  }

  const items: string[] = [];
  let index = 1;

  while (index < trimmed.length - 1) {
    while (/[\s,]/.test(trimmed[index] ?? "") && index < trimmed.length - 1) {
      index += 1;
    }

    const quote = trimmed[index];
    if (quote !== "'" && quote !== '"') {
      return null;
    }

    index += 1;
    let item = "";

    while (index < trimmed.length - 1) {
      const character = trimmed[index];

      if (character === "\\") {
        const next = trimmed[index + 1];
        if (next === undefined) {
          return null;
        }
        item += next;
        index += 2;
        continue;
      }

      if (character === quote) {
        index += 1;
        break;
      }

      item += character;
      index += 1;
    }

    items.push(item);

    while (/\s/.test(trimmed[index] ?? "") && index < trimmed.length - 1) {
      index += 1;
    }

    if (trimmed[index] === ",") {
      index += 1;
    }
  }

  return items.length ? items : null;
}

function normalizeConversationContent(content: string) {
  const parsed = parseStringArrayLiteral(content);
  return parsed ? parsed.join("\n").trim() : content;
}

function sanitizeMessages(messages: AnalysisConversation["messages"]) {
  const seenIds = new Set<string>();
  let changed = false;

  const nextMessages = messages.map((message) => {
    const normalizedId = message.id?.trim() || createTurnId(`message-${message.role}`);
    const normalizedContent = normalizeConversationContent(message.content);
    const contentChanged = normalizedContent !== message.content;
    const idChanged = !message.id?.trim() || seenIds.has(normalizedId);

    if (idChanged || contentChanged) {
      changed = true;
      const nextId = idChanged ? createTurnId(`message-${message.role}`) : message.id;
      seenIds.add(nextId);

      return {
        ...message,
        id: nextId,
        content: normalizedContent,
      };
    }

    seenIds.add(normalizedId);
    return message;
  });

  return {
    messages: nextMessages,
    changed,
  };
}

function buildFollowUpPreview(answer: string) {
  const normalized = normalizeConversationContent(answer).replace(/\s+/g, " ").trim();

  if (normalized.length <= 86) {
    return normalized;
  }

  return `${normalized.slice(0, 86)}...`;
}

function compactContextText(value: string, maxLength: number) {
  const normalized = normalizeConversationContent(value).replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`;
}

function limitContextSummary(value: string) {
  const trimmed = value.trim();

  if (trimmed.length <= FOLLOW_UP_CONTEXT_MAX_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, FOLLOW_UP_CONTEXT_MAX_LENGTH - 3)}...`;
}

function buildMatchSummaryContext(summary?: MatchSummary | null) {
  if (!summary) {
    return "";
  }

  const scoreKnown = summary.radiant_score != null || summary.dire_score != null;
  const score = scoreKnown
    ? `${summary.radiant_team} ${summary.radiant_score ?? "-"} : ${
        summary.dire_score ?? "-"
      } ${summary.dire_team}`
    : "";

  return [
    `比赛：${summary.title}`,
    score ? `比分：${score}` : "",
    summary.duration_text ? `时长：${summary.duration_text}` : "",
    `结果：${formatWinner(summary)}`,
    `Radiant 阵容：${formatLineup(summary.radiant_lineup)}`,
    `Dire 阵容：${formatLineup(summary.dire_lineup)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildFollowUpContextSummary({
  request,
  messages,
  question,
  matchSummary,
}: {
  request: AnalysisRequest;
  messages: AnalysisConversation["messages"];
  question: string;
  matchSummary?: MatchSummary | null;
}) {
  const previousContext = request.contextSummary.trim()
    ? `用户原始补充：${compactContextText(
        request.contextSummary,
        EXISTING_CONTEXT_MAX_LENGTH,
      )}`
    : "";
  const matchContext = buildMatchSummaryContext(matchSummary);
  const recentMessages = messages
    .slice(-6)
    .map((message) => {
      const speaker = message.role === "assistant" ? "助手" : "用户";
      return `${speaker}：${compactContextText(
        message.content,
        MESSAGE_CONTEXT_MAX_LENGTH,
      )}`;
    })
    .filter((line) => line.trim().length > 0);

  const context = [
    previousContext,
    "这是同一条复盘对话里的连续追问。请承接已有对话，不要把本轮问题当成孤立泛问题，也不要回答“你没有提供上下文”。",
    matchContext ? `当前比赛信息：\n${matchContext}` : "",
    recentMessages.length ? `已有对话：\n${recentMessages.join("\n")}` : "",
    `本轮追问：${question}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return limitContextSummary(context);
}

export function ResultView({
  request,
  conversation,
  warning,
  replayJob,
  matchSummary,
  deepThinking,
  onConversationChange,
}: ResultViewProps) {
  const sanitizedIncomingMessages = useMemo(
    () => sanitizeMessages(conversation.messages),
    [conversation.messages],
  );
  const [messages, setMessages] = useState(sanitizedIncomingMessages.messages);
  const [followUps, setFollowUps] = useState(conversation.followUps);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(
    Boolean(request.deepThinking || request.mode === "deep-thinking"),
  );
  const [sendError, setSendError] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [currentReplayJob, setCurrentReplayJob] = useState(replayJob ?? null);
  const [currentMatchSummary, setCurrentMatchSummary] = useState(matchSummary ?? null);
  const [currentDeepThinking, setCurrentDeepThinking] = useState(deepThinking ?? null);
  const [jobPollError, setJobPollError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestUpdateRef = useRef({
    conversation,
    warning,
    currentMatchSummary,
    currentDeepThinking,
    onConversationChange,
  });
  const autoLoadedReplayJobIdsRef = useRef<Set<string>>(new Set());
  const replayJobId = currentReplayJob?.job_id ?? "";
  const replayJobStatus = currentReplayJob?.status ?? "";

  useEffect(() => {
    setMessages(sanitizedIncomingMessages.messages);
    setFollowUps(conversation.followUps);
    setDraft("");
    setSendError("");
    setJobPollError("");
    setEditingMessageId(null);
    setEditingDraft("");
  }, [conversation, sanitizedIncomingMessages]);

  useEffect(() => {
    setCurrentReplayJob(replayJob ?? null);
  }, [replayJob]);

  useEffect(() => {
    setCurrentMatchSummary(matchSummary ?? null);
  }, [matchSummary]);

  useEffect(() => {
    setCurrentDeepThinking(deepThinking ?? null);
  }, [deepThinking]);

  useEffect(() => {
    setThinkingMode(Boolean(request.deepThinking || request.mode === "deep-thinking"));
  }, [request.deepThinking, request.focusQuestion, request.matchId, request.mode]);

  useEffect(() => {
    latestUpdateRef.current = {
      conversation,
      warning,
      currentMatchSummary,
      currentDeepThinking,
      onConversationChange,
    };
  }, [conversation, currentDeepThinking, currentMatchSummary, onConversationChange, warning]);

  const loadCompletedReplayAnalysis = useCallback(async (
    job: ReplayPreparation,
    fallbackMatchSummary?: MatchSummary | null,
  ) => {
    const matchId = request.matchId.trim();
    const loadKey = job.job_id || job.match_id || matchId;

    if (!matchId || autoLoadedReplayJobIdsRef.current.has(loadKey)) {
      return;
    }

    autoLoadedReplayJobIdsRef.current.add(loadKey);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });
      const payload = (await response.json()) as {
        conversation?: AnalysisConversation;
        warning?: string;
        replayJob?: ReplayPreparation | null;
        matchSummary?: MatchSummary | null;
        deepThinking?: DeepThinkingInsight | null;
      };

      if (!response.ok || !payload.conversation) {
        throw new Error("Replay analysis refresh failed.");
      }

      const sanitizedPayloadMessages = sanitizeMessages(payload.conversation.messages);
      const nextReplayJob =
        "replayJob" in payload ? payload.replayJob ?? job : job;
      const nextMatchSummary =
        payload.matchSummary ?? fallbackMatchSummary ?? currentMatchSummary;
      const nextDeepThinking = payload.deepThinking ?? currentDeepThinking;

      setMessages(sanitizedPayloadMessages.messages);
      setFollowUps(payload.conversation.followUps);
      setCurrentReplayJob(nextReplayJob);
      setCurrentMatchSummary(nextMatchSummary);
      setCurrentDeepThinking(nextDeepThinking);
      setJobPollError("");
      onConversationChange?.(payload.conversation, payload.warning ?? "", {
        replayJob: nextReplayJob,
        matchSummary: nextMatchSummary,
        deepThinking: nextDeepThinking,
      });
    } catch {
      autoLoadedReplayJobIdsRef.current.delete(loadKey);
      setJobPollError("录像已完成处理，但自动加载复盘失败。请重新提交这个比赛编号。");
    }
  }, [currentDeepThinking, currentMatchSummary, onConversationChange, request]);

  useEffect(() => {
    if (!sanitizedIncomingMessages.changed) {
      return;
    }

    onConversationChange?.({
      ...conversation,
      messages: sanitizedIncomingMessages.messages,
    });
  }, [conversation, onConversationChange, sanitizedIncomingMessages]);

  useEffect(() => {
    const node = bottomRef.current;
    if (!node) {
      return;
    }

    if (typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }, [messages.length, isSending]);

  useEffect(() => {
    const node = inputRef.current;
    if (!node) {
      return;
    }

    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, INPUT_MAX_HEIGHT_PX)}px`;
  }, [draft]);

  useEffect(() => {
    if (!replayJobId || !isReplayJobStatusActive(replayJobStatus)) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function pollJob() {
      try {
        const response = await fetch(`/api/replays/jobs/${replayJobId}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as ReplayJobStatusPayload;

        if (!response.ok || !payload.job) {
          throw new Error("Replay job status request failed.");
        }

        if (cancelled) {
          return;
        }

        const nextJob: ReplayPreparation = {
          job_id: payload.job.job_id,
          match_id: payload.job.match_id,
          status: payload.job.status,
          detail: payload.job.detail,
          error: payload.job.error,
        };
        const nextMatchSummary =
          payload.matchSummary ?? latestUpdateRef.current.currentMatchSummary ?? null;

        setCurrentReplayJob(nextJob);
        setCurrentMatchSummary(nextMatchSummary);
        setJobPollError("");
        latestUpdateRef.current.onConversationChange?.(
          latestUpdateRef.current.conversation,
          latestUpdateRef.current.warning,
          {
            replayJob: nextJob,
            matchSummary: nextMatchSummary,
          },
        );

        if (isReplayJobActive(nextJob)) {
          timer = setTimeout(pollJob, 3000);
        } else if (nextJob.status === "completed") {
          void loadCompletedReplayAnalysis(nextJob, nextMatchSummary);
        }
      } catch {
        if (!cancelled) {
          setJobPollError("录像解析状态同步失败，请稍后刷新重试。");
          timer = setTimeout(pollJob, 5000);
        }
      }
    }

    void pollJob();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [loadCompletedReplayAnalysis, replayJobId, replayJobStatus]);

  useEffect(() => {
    if (currentReplayJob?.status !== "completed") {
      return;
    }

    void loadCompletedReplayAnalysis(currentReplayJob, currentMatchSummary);
  }, [currentMatchSummary, currentReplayJob, loadCompletedReplayAnalysis]);

  const conversationModeLabel =
    conversation.mode === "match-replay" ? "录像复盘" : "问题分析";
  const conversationTitle = buildConversationTitle(request, conversation);
  const conversationSummary = buildConversationSummary(conversation);
  const generatedAtLabel = formatGeneratedAt(conversation.generatedAt);
  const playerSideLabel = formatPlayerSideContext(request.playerSide);
  const playerPositionLabel = formatPlayerPositionContext(request.playerPosition);

  async function submitQuestion(
    rawQuestion: string,
    options?: { baseMessages?: AnalysisConversation["messages"] },
  ) {
    const question = rawQuestion.trim();

    if (!question || isSending) {
      return;
    }

    setSendError("");
    setDraft("");

    const baseMessages = options?.baseMessages ?? messages;
    const userMessageId = createTurnId("follow-up-user");
    const userMessage = {
      id: userMessageId,
      role: "user" as const,
      content: question,
    };
    const nextMessagesWithUser = [...baseMessages, userMessage];

    setMessages(nextMessagesWithUser);
    setIsSending(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...request,
          mode: resolveThinkingRequestMode(request, thinkingMode),
          deepThinking: thinkingMode,
          focusQuestion: question,
          contextSummary: buildFollowUpContextSummary({
            request,
            messages: baseMessages,
            question,
            matchSummary: currentMatchSummary,
          }),
        }),
        signal: controller.signal,
      });

      const payload = (await response.json()) as {
        error?: string;
        conversation?: AnalysisConversation;
        warning?: string;
        replayJob?: ReplayPreparation | null;
        matchSummary?: MatchSummary | null;
        deepThinking?: DeepThinkingInsight | null;
      };

      if (!response.ok || !payload.conversation) {
        setSendError(payload.error ?? "继续追问失败，请稍后再试。");
        return;
      }

      const assistantMessage =
        payload.conversation.messages[payload.conversation.messages.length - 1];

      if (!assistantMessage || assistantMessage.role !== "assistant") {
        setSendError("对话结果解析失败，请稍后再试。");
        return;
      }

      const assistantId = createTurnId("follow-up-assistant");
      const nextMessages = [
        ...nextMessagesWithUser,
        {
          id: assistantId,
          role: "assistant" as const,
          content: assistantMessage.content,
          deepThinking: thinkingMode || undefined,
        },
      ];

      const nextReplayJob =
        "replayJob" in payload ? payload.replayJob ?? null : currentReplayJob;
      const nextMatchSummary = payload.matchSummary ?? currentMatchSummary;
      const nextDeepThinking = payload.deepThinking ?? currentDeepThinking;

      setMessages(nextMessages);
      setFollowUps(payload.conversation.followUps);
      setCurrentReplayJob(nextReplayJob);
      setCurrentMatchSummary(nextMatchSummary);
      setCurrentDeepThinking(nextDeepThinking);
      onConversationChange?.({
        ...conversation,
        messages: nextMessages,
        followUps: payload.conversation.followUps,
        generatedAt: payload.conversation.generatedAt,
        source: payload.conversation.source,
      }, payload.warning, {
        replayJob: nextReplayJob,
        matchSummary: nextMatchSummary,
        deepThinking: nextDeepThinking,
      });
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        // User stopped the request — keep their message visible so they can edit & retry.
        onConversationChange?.({
          ...conversation,
          messages: nextMessagesWithUser,
        });
        return;
      }
      setSendError("继续追问失败，请稍后再试。");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsSending(false);
    }
  }

  function stopRequest() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }

  function beginEdit(messageId: string, content: string) {
    if (isSending) {
      return;
    }
    setEditingMessageId(messageId);
    setEditingDraft(content);
    setSendError("");
  }

  function cancelEdit() {
    setEditingMessageId(null);
    setEditingDraft("");
  }

  async function submitEdit(messageId: string) {
    const trimmed = editingDraft.trim();
    if (!trimmed || isSending) {
      return;
    }

    const index = messages.findIndex((message) => message.id === messageId);
    if (index < 0) {
      return;
    }

    const baseMessages = messages.slice(0, index);
    setEditingMessageId(null);
    setEditingDraft("");
    setMessages(baseMessages);

    await submitQuestion(trimmed, { baseMessages });
  }

  useEffect(() => {
    if (editingMessageId && editTextareaRef.current) {
      const node = editTextareaRef.current;
      node.style.height = "auto";
      node.style.height = `${Math.min(node.scrollHeight, EDIT_MAX_HEIGHT_PX)}px`;
      node.focus();
      node.setSelectionRange(node.value.length, node.value.length);
    }
  }, [editingMessageId, editingDraft]);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  return (
    <section className="analysis-chat-app analysis-chat-app-theme-notion analysis-chat-app-theme-cool">
      <div className="analysis-thread-shell analysis-chat-document">
        <header className="analysis-chat-header">
          <div className="analysis-chat-header-copy">
            <span className="analysis-chat-context-kicker">当前分析</span>
            <h1 className="analysis-chat-header-title">{conversationTitle}</h1>
            <p className="analysis-chat-header-subtitle">{conversationSummary}</p>
          </div>

          <div className="analysis-chat-context">
            <div className="analysis-chat-context-chips">
              <span className="analysis-chat-context-chip">{conversationModeLabel}</span>
              {request.matchId.trim() ? (
                <span className="analysis-chat-context-chip">
                  比赛 {request.matchId.trim()}
                </span>
              ) : null}
              {playerSideLabel ? (
                <span className="analysis-chat-context-chip">{playerSideLabel}</span>
              ) : null}
              {playerPositionLabel ? (
                <span className="analysis-chat-context-chip">
                  {playerPositionLabel}
                </span>
              ) : null}
              {generatedAtLabel ? (
                <span className="analysis-chat-context-chip">{generatedAtLabel}</span>
              ) : null}
            </div>
          </div>
        </header>

        {warning ? <div className="warning-banner">{warning}</div> : null}

        {currentDeepThinking ? (
          <DeepThinkingPanel insight={currentDeepThinking} />
        ) : null}

        {currentMatchSummary ? (
          <section className="match-summary-card" aria-label="比赛摘要">
            <div className="match-summary-header">
              <span className="match-summary-title">{currentMatchSummary.title}</span>
              <span className="match-summary-duration">
                {currentMatchSummary.duration_text || ""}
              </span>
            </div>
            <div className="match-summary-scoreboard">
              <div className="match-summary-team match-summary-team-radiant">
                <span className="match-summary-team-name">{currentMatchSummary.radiant_team}</span>
                <span className="match-summary-score">{currentMatchSummary.radiant_score ?? "-"}</span>
              </div>
              <span className="match-summary-divider">:</span>
              <div className="match-summary-team match-summary-team-dire">
                <span className="match-summary-score">{currentMatchSummary.dire_score ?? "-"}</span>
                <span className="match-summary-team-name">{currentMatchSummary.dire_team}</span>
              </div>
            </div>
            <div className="match-summary-verdict">
              {formatWinner(currentMatchSummary)}
            </div>
            <div className="match-summary-lineups">
              <div className="match-summary-lineup">
                <span className="match-summary-lineup-label">Radiant</span>
                <span className="match-summary-lineup-names">
                  {formatLineup(currentMatchSummary.radiant_lineup)}
                </span>
              </div>
              <div className="match-summary-lineup">
                <span className="match-summary-lineup-label">Dire</span>
                <span className="match-summary-lineup-names">
                  {formatLineup(currentMatchSummary.dire_lineup)}
                </span>
              </div>
            </div>
          </section>
        ) : null}

        {currentReplayJob ? <ReplayProgressCard job={currentReplayJob} /> : null}

        {jobPollError ? <div className="danger-banner">{jobPollError}</div> : null}

        <div className="analysis-chat-scroll analysis-chat-thread-stage">
          {messages.map((message) => {
            const isEditing =
              message.role === "user" && editingMessageId === message.id;

            return (
              <article
                key={message.id}
                className={`analysis-chat-row analysis-chat-row-${message.role} ${
                  message.role === "user" ? "analysis-chat-row-user-compact" : ""
                } ${isEditing ? "analysis-chat-row-editing" : ""}`}
              >
                <div
                  className={`analysis-chat-bubble analysis-chat-bubble-${message.role} analysis-chat-message-block analysis-chat-message-block-${message.role} ${
                    message.role === "user"
                      ? "analysis-chat-message-block-user-compact"
                      : ""
                  } ${isEditing ? "analysis-chat-message-block-editing" : ""} ${
                    message.role === "assistant" && message.deepThinking
                      ? "analysis-chat-message-block-deep-thinking"
                      : ""
                  }`}
                >
                  <div className="analysis-chat-bubble-head">
                    <span className="analysis-chat-bubble-label">
                      {message.role === "assistant" ? "Ancient Lens" : "你"}
                    </span>
                    {message.role === "assistant" && message.deepThinking ? (
                      <span
                        className="analysis-chat-deep-thinking-badge"
                        title="本回复使用了深度思考模式"
                      >
                        <Sparkles size={11} aria-hidden="true" />
                        <span>深度思考</span>
                      </span>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <div className="analysis-chat-edit-form">
                      <textarea
                        ref={editTextareaRef}
                        aria-label="编辑这条消息"
                        value={editingDraft}
                        onChange={(event) => setEditingDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            event.preventDefault();
                            cancelEdit();
                            return;
                          }
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey &&
                            !event.nativeEvent.isComposing
                          ) {
                            event.preventDefault();
                            void submitEdit(message.id);
                          }
                        }}
                        className="analysis-chat-edit-textarea"
                        rows={1}
                      />
                      <div className="analysis-chat-edit-actions">
                        <button
                          type="button"
                          className="analysis-chat-edit-cancel"
                          onClick={cancelEdit}
                        >
                          <X size={15} aria-hidden="true" />
                          <span>取消</span>
                        </button>
                        <button
                          type="button"
                          className="analysis-chat-edit-confirm"
                          onClick={() => void submitEdit(message.id)}
                          disabled={!editingDraft.trim() || isSending}
                        >
                          <SendHorizontal size={15} aria-hidden="true" />
                          <span>重新发送</span>
                        </button>
                      </div>
                    </div>
                  ) : message.role === "assistant" && message.pending ? (
                    <div
                      className="analysis-chat-typing"
                      role="status"
                      aria-label="正在生成回答"
                    >
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : (
                    <div className="analysis-chat-copy">
                      {message.role === "assistant" ? (
                        renderAssistantContent(message.content)
                      ) : (
                        <p className="analysis-chat-paragraph analysis-chat-paragraph-user">
                          {message.content}
                        </p>
                      )}
                    </div>
                  )}

                  {!isEditing && message.role === "assistant" && !message.pending ? (
                    <div className="analysis-chat-message-actions">
                      <button
                        type="button"
                        className="analysis-chat-action-copy"
                        aria-label="复制回复"
                        title="复制回复"
                        onClick={() => {
                          void navigator.clipboard.writeText(message.content);
                        }}
                      >
                        <Copy size={14} aria-hidden="true" />
                        <span>复制</span>
                      </button>
                    </div>
                  ) : null}
                </div>

                {!isEditing && message.role === "user" ? (
                  <div className="analysis-chat-row-edit-action">
                    <button
                      type="button"
                      className="analysis-chat-action-edit"
                      aria-label="编辑并重新发送"
                      title="编辑并重新发送这条消息"
                      onClick={() => beginEdit(message.id, message.content)}
                      disabled={isSending || editingMessageId !== null}
                    >
                      <Pencil size={13} aria-hidden="true" />
                      <span>编辑</span>
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}

          {isSending ? (
            <article
              className="analysis-chat-row analysis-chat-row-assistant"
              aria-live="polite"
            >
              <div className="analysis-chat-bubble analysis-chat-bubble-assistant analysis-chat-message-block analysis-chat-message-block-assistant">
                <div className="analysis-chat-bubble-head">
                  <span className="analysis-chat-bubble-label">Ancient Lens</span>
                  {thinkingMode ? (
                    <span className="analysis-chat-thinking-pill">
                      <Sparkles size={12} aria-hidden="true" />
                      深度思考中
                    </span>
                  ) : null}
                </div>
                {thinkingMode ? (
                  <div
                    className="analysis-chat-thinking-shimmer"
                    role="status"
                    aria-label="正在深度思考"
                  >
                    <span className="analysis-chat-thinking-shimmer-text">
                      正在调取更长上下文，逐步推导关键节点……
                    </span>
                  </div>
                ) : (
                  <div
                    className="analysis-chat-typing"
                    role="status"
                    aria-label="正在分析"
                  >
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </div>
            </article>
          ) : null}

          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </div>

      <div className="analysis-chat-dock analysis-chat-dock-blended analysis-chat-dock-integrated">
        <section className="analysis-chat-suggestion-block analysis-chat-suggestion-strip">
          <div className="analysis-chat-suggestion-head">
            <span className="analysis-chat-suggestion-title">下一步方案</span>
            <span className="analysis-chat-suggestion-count">{followUps.length}</span>
          </div>
          <div className="analysis-chat-suggestions">
            {followUps.map((followUp, index) => (
              <button
                key={`${followUp.question}-${index}`}
                type="button"
                className="analysis-chat-suggestion"
                aria-label={followUp.question}
                onClick={() => void submitQuestion(followUp.question)}
              >
                <span className="analysis-chat-suggestion-meta">
                  方案 {index + 1}
                </span>
                <span className="analysis-chat-suggestion-question">
                  {followUp.question}
                </span>
                <span className="analysis-chat-suggestion-preview">
                  {buildFollowUpPreview(followUp.answer)}
                </span>
                <ChevronRight
                  size={16}
                  className="analysis-chat-suggestion-icon"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </section>

        <div className="analysis-chat-composer-shell">
          <form
            className={`analysis-chat-composer analysis-chat-composer-bar analysis-chat-composer-bar-subtle analysis-chat-composer-bar-integrated analysis-chat-composer-bar-stacked ${
              thinkingMode ? "analysis-chat-composer-bar-thinking" : ""
            }`}
            onSubmit={(event) => {
              event.preventDefault();
              void submitQuestion(draft);
            }}
          >
            <label htmlFor="analysis-follow-up" className="sr-only">
              继续追问
            </label>
            <textarea
              id="analysis-follow-up"
              ref={inputRef}
              aria-label="继续追问"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  if (!isSending && draft.trim()) {
                    void submitQuestion(draft);
                  }
                }
              }}
              className="analysis-chat-input analysis-chat-input-tall analysis-chat-input-taller"
              placeholder={
                editingMessageId !== null
                  ? "正在编辑上方的消息……"
                  : conversation.mode === "match-replay"
                  ? "继续问这场比赛，比如：这局高地前到底哪里脱节了？"
                  : "继续问这个问题，比如：给我更偏排位的版本。"
              }
              disabled={editingMessageId !== null}
              rows={1}
            />

            <div className="analysis-chat-composer-actions">
              <button
                type="button"
                className={`analysis-chat-thinking-toggle ${
                  thinkingMode ? "analysis-chat-thinking-toggle-active" : ""
                }`}
                aria-pressed={thinkingMode}
                disabled={isSending || editingMessageId !== null}
                title={
                  isSending
                    ? "请求进行中，本次模式已锁定"
                    : thinkingMode
                    ? "已开启深度思考：耗时更久，分析更细"
                    : "开启深度思考：让模型用更长时间做更专业的分析"
                }
                onClick={() => setThinkingMode((current) => !current)}
              >
                <Sparkles size={14} aria-hidden="true" />
                <span>深度思考</span>
                <span
                  className="analysis-chat-thinking-toggle-state"
                  aria-hidden="true"
                >
                  {thinkingMode ? "ON" : "OFF"}
                </span>
              </button>

              {isSending ? (
                <button
                  type="button"
                  className="analysis-chat-send analysis-chat-send-stop"
                  onClick={stopRequest}
                  aria-label="停止生成"
                  title="停止生成（保留你的问题，可编辑后重发）"
                >
                  <Square size={11} fill="currentColor" aria-hidden="true" />
                  <span>停止</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="analysis-chat-send analysis-chat-send-muted analysis-chat-send-soft"
                  disabled={!draft.trim() || editingMessageId !== null}
                >
                  <SendHorizontal size={16} aria-hidden="true" />
                  <span>发送</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {sendError ? <div className="danger-banner">{sendError}</div> : null}
      </div>
    </section>
  );
}
