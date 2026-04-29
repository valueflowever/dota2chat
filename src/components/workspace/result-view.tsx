"use client";

import { SendHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  AnalysisConversation,
  AnalysisRequest,
  MatchSummary,
  ReplayPreparation,
} from "@/lib/analysis/schema";

const INPUT_MAX_HEIGHT_PX = 180;

function renderInlineSegments(text: string, keyPrefix: string): ReactNode {
  if (!text) {
    return null;
  }

  const segments: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`/g;
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
  onConversationChange?: (
    conversation: AnalysisConversation,
    warning?: string,
    meta?: ResultMetaUpdate,
  ) => void;
};

type ResultMetaUpdate = {
  replayJob?: ReplayPreparation | null;
  matchSummary?: MatchSummary | null;
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

function formatReplayJobStatus(status: string) {
  if (status === "queued") {
    return "排队中";
  }

  if (status === "running") {
    return "解析中";
  }

  if (status === "completed") {
    return "解析完成";
  }

  if (status === "failed") {
    return "解析失败";
  }

  return status;
}

function formatReplayJobDetail(job: ReplayPreparation) {
  if (job.status === "queued") {
    return "已加入解析队列，系统会自动下载并解析录像。";
  }

  if (job.status === "running") {
    return "正在下载或解析录像，完成后会同步比赛摘要。";
  }

  if (job.status === "completed") {
    return "录像解析已完成，现在可以重新分析并读取 timeslices。";
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

function isReplayJobStatusActive(status?: string | null) {
  return status === "queued" || status === "running";
}

function isReplayJobActive(job?: ReplayPreparation | null) {
  return isReplayJobStatusActive(job?.status);
}

function createTurnId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeMessages(messages: AnalysisConversation["messages"]) {
  const seenIds = new Set<string>();
  let changed = false;

  const nextMessages = messages.map((message) => {
    const normalizedId = message.id?.trim() || createTurnId(`message-${message.role}`);

    if (!message.id?.trim() || seenIds.has(normalizedId)) {
      changed = true;

      return {
        ...message,
        id: createTurnId(`message-${message.role}`),
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

export function ResultView({
  request,
  conversation,
  warning,
  replayJob,
  matchSummary,
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
  const [sendError, setSendError] = useState("");
  const [currentReplayJob, setCurrentReplayJob] = useState(replayJob ?? null);
  const [currentMatchSummary, setCurrentMatchSummary] = useState(matchSummary ?? null);
  const [jobPollError, setJobPollError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const latestUpdateRef = useRef({
    conversation,
    warning,
    currentMatchSummary,
    onConversationChange,
  });
  const replayJobId = currentReplayJob?.job_id ?? "";
  const replayJobStatus = currentReplayJob?.status ?? "";

  useEffect(() => {
    setMessages(sanitizedIncomingMessages.messages);
    setFollowUps(conversation.followUps);
    setDraft("");
    setSendError("");
    setJobPollError("");
  }, [conversation, sanitizedIncomingMessages]);

  useEffect(() => {
    setCurrentReplayJob(replayJob ?? null);
  }, [replayJob]);

  useEffect(() => {
    setCurrentMatchSummary(matchSummary ?? null);
  }, [matchSummary]);

  useEffect(() => {
    latestUpdateRef.current = {
      conversation,
      warning,
      currentMatchSummary,
      onConversationChange,
    };
  }, [conversation, currentMatchSummary, onConversationChange, warning]);

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
  }, [replayJobId, replayJobStatus]);

  const conversationModeLabel =
    conversation.mode === "match-replay" ? "录像复盘" : "问题分析";
  const conversationTitle = buildConversationTitle(request, conversation);
  const conversationSummary = buildConversationSummary(conversation);
  const generatedAtLabel = formatGeneratedAt(conversation.generatedAt);

  async function submitQuestion(rawQuestion: string) {
    const question = rawQuestion.trim();

    if (!question || isSending) {
      return;
    }

    setSendError("");
    setDraft("");

    const userMessageId = createTurnId("follow-up-user");
    const userMessage = {
      id: userMessageId,
      role: "user" as const,
      content: question,
    };
    const nextMessagesWithUser = [...messages, userMessage];

    setMessages(nextMessagesWithUser);
    setIsSending(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...request,
          focusQuestion: question,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        conversation?: AnalysisConversation;
        warning?: string;
        replayJob?: ReplayPreparation | null;
        matchSummary?: MatchSummary | null;
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
        },
      ];

      const nextReplayJob =
        "replayJob" in payload ? payload.replayJob ?? null : currentReplayJob;
      const nextMatchSummary = payload.matchSummary ?? currentMatchSummary;

      setMessages(nextMessages);
      setFollowUps(payload.conversation.followUps);
      setCurrentReplayJob(nextReplayJob);
      setCurrentMatchSummary(nextMatchSummary);
      onConversationChange?.({
        ...conversation,
        messages: nextMessages,
        followUps: payload.conversation.followUps,
        generatedAt: payload.conversation.generatedAt,
        source: payload.conversation.source,
      }, payload.warning, {
        replayJob: nextReplayJob,
        matchSummary: nextMatchSummary,
      });
    } catch {
      setSendError("继续追问失败，请稍后再试。");
    } finally {
      setIsSending(false);
    }
  }

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
              <span className="analysis-chat-context-chip">{conversation.source}</span>
              {generatedAtLabel ? (
                <span className="analysis-chat-context-chip">{generatedAtLabel}</span>
              ) : null}
            </div>
          </div>
        </header>

        {warning ? <div className="warning-banner">{warning}</div> : null}

        {currentMatchSummary ? (
          <section className="warning-banner" aria-label="比赛摘要">
            <strong>{currentMatchSummary.title}</strong>
            <div>
              {currentMatchSummary.radiant_team} {currentMatchSummary.radiant_score ?? "-"} :{" "}
              {currentMatchSummary.dire_score ?? "-"} {currentMatchSummary.dire_team}
            </div>
            <div>
              {formatWinner(currentMatchSummary)}
              {currentMatchSummary.duration_text ? ` · ${currentMatchSummary.duration_text}` : ""}
            </div>
            <div>Radiant：{formatLineup(currentMatchSummary.radiant_lineup)}</div>
            <div>Dire：{formatLineup(currentMatchSummary.dire_lineup)}</div>
          </section>
        ) : null}

        {currentReplayJob ? (
          <section className="warning-banner" aria-label="录像解析状态">
            <strong>录像解析：{formatReplayJobStatus(currentReplayJob.status)}</strong>
            <div>{formatReplayJobDetail(currentReplayJob)}</div>
            {isReplayJobActive(currentReplayJob) ? (
              <div>解析完成后会自动同步比赛信息，再次分析即可读取 timeslices。</div>
            ) : null}
          </section>
        ) : null}

        {jobPollError ? <div className="danger-banner">{jobPollError}</div> : null}

        <div className="analysis-chat-scroll analysis-chat-thread-stage">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`analysis-chat-row analysis-chat-row-${message.role} ${
                message.role === "user" ? "analysis-chat-row-user-compact" : ""
              }`}
            >
              <div
                className={`analysis-chat-bubble analysis-chat-bubble-${message.role} analysis-chat-message-block analysis-chat-message-block-${message.role} ${
                  message.role === "user" ? "analysis-chat-message-block-user-compact" : ""
                }`}
              >
                <div className="analysis-chat-bubble-head">
                  <span className="analysis-chat-bubble-label">
                    {message.role === "assistant" ? "Ancient Lens" : "你"}
                  </span>
                </div>
                <div className="analysis-chat-copy">
                  {message.role === "assistant" ? (
                    renderAssistantContent(message.content)
                  ) : (
                    <p className="analysis-chat-paragraph analysis-chat-paragraph-user">
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}

          {isSending ? (
            <article
              className="analysis-chat-row analysis-chat-row-assistant"
              aria-live="polite"
            >
              <div className="analysis-chat-bubble analysis-chat-bubble-assistant analysis-chat-message-block analysis-chat-message-block-assistant">
                <div className="analysis-chat-bubble-head">
                  <span className="analysis-chat-bubble-label">Ancient Lens</span>
                </div>
                <div
                  className="analysis-chat-typing"
                  role="status"
                  aria-label="正在分析"
                >
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </article>
          ) : null}

          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </div>

      <div className="analysis-chat-dock analysis-chat-dock-blended analysis-chat-dock-integrated">
        <section className="analysis-chat-suggestion-block analysis-chat-suggestion-strip">
          <div className="analysis-chat-suggestions">
            {followUps.map((followUp) => (
              <button
                key={followUp.question}
                type="button"
                className="analysis-chat-suggestion"
                onClick={() => void submitQuestion(followUp.question)}
              >
                {followUp.question}
              </button>
            ))}
          </div>
        </section>

        <div className="analysis-chat-composer-shell">
          <form
            className="analysis-chat-composer analysis-chat-composer-bar analysis-chat-composer-bar-subtle analysis-chat-composer-bar-integrated"
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
                conversation.mode === "match-replay"
                  ? "继续问这场比赛，比如：这局高地前到底哪里脱节了？"
                  : "继续问这个问题，比如：给我更偏排位的版本。"
              }
              rows={1}
            />

            <button
              type="submit"
              className="analysis-chat-send analysis-chat-send-muted analysis-chat-send-soft"
              disabled={isSending || !draft.trim()}
            >
              <SendHorizontal size={16} aria-hidden="true" />
              <span>{isSending ? "发送中..." : "发送"}</span>
            </button>
          </form>
        </div>

        {sendError ? <div className="danger-banner">{sendError}</div> : null}
      </div>
    </section>
  );
}
