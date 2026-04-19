"use client";

import { SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type {
  AnalysisConversation,
  AnalysisRequest,
} from "@/lib/analysis/schema";

type ResultViewProps = {
  request: AnalysisRequest;
  conversation: AnalysisConversation;
  warning?: string;
  onConversationChange?: (conversation: AnalysisConversation) => void;
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

  useEffect(() => {
    setMessages(sanitizedIncomingMessages.messages);
    setFollowUps(conversation.followUps);
    setDraft("");
    setSendError("");
  }, [conversation, sanitizedIncomingMessages]);

  useEffect(() => {
    if (!sanitizedIncomingMessages.changed) {
      return;
    }

    onConversationChange?.({
      ...conversation,
      messages: sanitizedIncomingMessages.messages,
    });
  }, [conversation, onConversationChange, sanitizedIncomingMessages]);

  const conversationModeLabel =
    conversation.mode === "match-replay" ? "录像复盘" : "问题分析";
  const conversationTitle = buildConversationTitle(request, conversation);
  const conversationSummary = buildConversationSummary(conversation);
  const generatedAtLabel = formatGeneratedAt(conversation.generatedAt);

  function appendTurn(question: string, answer: string) {
    const userTurnId = createTurnId("follow-up-user");
    const assistantTurnId = createTurnId("follow-up-assistant");
    const nextMessages = [
      ...messages,
      {
        id: userTurnId,
        role: "user" as const,
        content: question,
      },
      {
        id: assistantTurnId,
        role: "assistant" as const,
        content: answer,
      },
    ];

    setMessages(nextMessages);
    onConversationChange?.({
      ...conversation,
      messages: nextMessages,
      followUps,
    });
  }

  async function submitQuestion(
    rawQuestion: string,
    options?: { localAnswer?: string },
  ) {
    const question = rawQuestion.trim();

    if (!question || isSending) {
      return;
    }

    setSendError("");
    setDraft("");

    if (options?.localAnswer) {
      appendTurn(question, options.localAnswer);
      return;
    }

    const userMessageId = `user-${Date.now()}`;
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

      const assistantId = `assistant-${Date.now()}`;
      const nextMessages = [
        ...nextMessagesWithUser,
        {
          id: assistantId,
          role: "assistant" as const,
          content: assistantMessage.content,
        },
      ];

      setMessages(nextMessages);
      setFollowUps(payload.conversation.followUps);
      onConversationChange?.({
        ...conversation,
        messages: nextMessages,
        followUps: payload.conversation.followUps,
        generatedAt: payload.conversation.generatedAt,
        source: payload.conversation.source,
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
                <p className="analysis-chat-copy">{message.content}</p>
              </div>
            </article>
          ))}
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
                onClick={() =>
                  void submitQuestion(followUp.question, {
                    localAnswer: followUp.answer,
                  })
                }
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
              aria-label="继续追问"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
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
