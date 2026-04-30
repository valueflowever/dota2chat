"use client";

import { ChevronUp, PanelLeftClose, PanelLeftOpen, Search, Settings2, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ResultView } from "@/components/workspace/result-view";
import { defaultDraft } from "@/components/workspace/sample-data";
import {
  clearCurrentAnalysisResult,
  deleteAnalysisHistoryItem,
  getAnalysisHistorySnapshot,
  getAnalysisResultSnapshot,
  loadDraftState,
  saveAnalysisResult,
  saveDraftState,
  selectAnalysisHistoryItem,
  subscribeAnalysisResult,
} from "@/lib/analysis/client-session";
import { detectAnalysisInput } from "@/lib/analysis/input-mode";
import type {
  AnalysisConversation,
  AnalysisRequest,
  MatchSummary,
  ReplayPreparation,
} from "@/lib/analysis/schema";

type AnalyzeApiResponse = {
  conversation: AnalysisConversation;
  warning?: string;
  replayJob?: ReplayPreparation | null;
  matchSummary?: MatchSummary | null;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const ADVANCED_OPTIONS_LABEL = "设置";
const ENTRY_LABEL = "比赛 ID 或问题";
const FOCUS_QUESTION_LABEL = "补充说明";
const PLAYER_SIDE_LABEL = "我方阵营";
const PLAYER_POSITION_LABEL = "我的位置";
const DEFAULT_REPLAY_QUESTION =
  "请分析这场比赛的整体节奏、关键转折点，以及下一把最值得优先修正的一项动作。";
const REPLAY_PROCESSING_ESTIMATE =
  "预计 1-3 分钟；如果需要下载录像或解析服务刚启动，可能会更久。";
const EMPTY_HISTORY: ReturnType<typeof getAnalysisHistorySnapshot> = [];

const PLAYER_SIDE_OPTIONS: Array<{
  value: AnalysisRequest["playerSide"];
  label: string;
}> = [
  { value: "", label: "未选择" },
  { value: "radiant", label: "天辉" },
  { value: "dire", label: "夜魇" },
];

const PLAYER_POSITION_OPTIONS: Array<{
  value: AnalysisRequest["playerPosition"];
  label: string;
}> = [
  { value: "", label: "未选择" },
  { value: "1", label: "1 号位" },
  { value: "2", label: "2 号位" },
  { value: "3", label: "3 号位" },
  { value: "4", label: "4 号位" },
  { value: "5", label: "5 号位" },
];

const EXAMPLE_PROMPTS = [
  "我中单总在 7-12 分钟掉节奏，怎么修？",
  "Roshan 前 20 秒该干什么？",
  "团战阵容怎么打才不会乱？",
  "辅助前 5 分钟怎么保大核不被压崩？",
  "帮我复盘这场比赛，找一下高地前脱节的原因",
] as const;

function cloneRequest(request: AnalysisRequest): AnalysisRequest {
  return {
    ...defaultDraft,
    ...request,
    timeline: (request.timeline ?? []).map((event) => ({ ...event })),
  };
}

function prepareSubmission(entryText: string, draft: AnalysisRequest): AnalysisRequest {
  const parsedEntry = detectAnalysisInput(entryText);
  const supplement = draft.focusQuestion.trim();

  if (parsedEntry.mode === "match-replay") {
    return {
      ...draft,
      matchId: parsedEntry.normalizedValue,
      focusQuestion: supplement || DEFAULT_REPLAY_QUESTION,
    };
  }

  return {
    ...draft,
    matchId: "",
    focusQuestion: parsedEntry.normalizedValue,
    contextSummary: [draft.contextSummary.trim(), supplement].filter(Boolean).join("\n\n"),
  };
}

function buildHistoryLabel(title: string) {
  return title.trim() || "未命名对话";
}

function buildReplayProcessingConversation(
  request: AnalysisRequest,
): AnalysisConversation {
  const matchId = request.matchId.trim();

  return {
    mode: "match-replay",
    title: `比赛 ${matchId}`,
    summary: "录像处理中",
    source: "demo-engine",
    generatedAt: new Date().toISOString(),
    messages: [
      {
        id: "user-entry",
        role: "user",
        content: matchId,
      },
      {
        id: "assistant-entry",
        role: "assistant",
        content: [
          `已收到比赛 ${matchId}，我先把对话打开。`,
          `录像正在后台处理，${REPLAY_PROCESSING_ESTIMATE}`,
          "数据准备好之前，我不会编造这局的时间点、经济差或具体操作。处理完成后回到这条对话，就能继续基于这场比赛复盘。",
        ].join("\n\n"),
      },
    ],
    followUps: [
      {
        question: "大概多久能好？",
        answer: REPLAY_PROCESSING_ESTIMATE,
      },
      {
        question: "处理好后怎么继续？",
        answer: "回到这条对话即可。录像数据准备好后，继续问这场比赛的问题，会直接读取对应录像数据。",
      },
      {
        question: "现在会不会编造细节？",
        answer: "不会。未解析完成前只显示处理状态，不会把通用建议包装成这场比赛的结论。",
      },
    ],
  };
}

export function AnalysisWorkspace() {
  const currentResult = useSyncExternalStore(
    subscribeAnalysisResult,
    getAnalysisResultSnapshot,
    () => null,
  );
  const history = useSyncExternalStore(
    subscribeAnalysisResult,
    getAnalysisHistorySnapshot,
    () => EMPTY_HISTORY,
  );

  const [draft, setDraft] = useState<AnalysisRequest>(defaultDraft);
  const [entryText, setEntryText] = useState("");
  const [replayLoaderValue, setReplayLoaderValue] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    const storedDraftState = loadDraftState();

    if (storedDraftState) {
      const restoredDraft = cloneRequest(storedDraftState.draft);
      const restoredEntry =
        storedDraftState.entryText ??
        (restoredDraft.matchId || restoredDraft.focusQuestion || "");

      setDraft(restoredDraft);
      setEntryText(restoredEntry);
      setReplayLoaderValue(restoredDraft.matchId || "");
      setShowAdvanced(storedDraftState.showAdvanced);
    }

    setHasRestoredDraft(true);
  }, []);

  useEffect(() => {
    if (!hasRestoredDraft) {
      return;
    }

    saveDraftState({
      draft,
      entryText,
      showAdvanced,
    });
  }, [draft, entryText, showAdvanced, hasRestoredDraft]);

  useEffect(() => {
    if (currentResult?.request.matchId) {
      setReplayLoaderValue(currentResult.request.matchId);
    }
  }, [currentResult?.request.matchId]);

  function handleNewChat() {
    clearCurrentAnalysisResult();
    setDraft(defaultDraft);
    setShowAdvanced(false);
    setRequestError("");
    setFieldErrors({});
    setEntryText("");
    setReplayLoaderValue("");
  }

  function updateFocusQuestion(value: string) {
    setDraft((current) => ({
      ...current,
      focusQuestion: value,
    }));
  }

  function updatePlayerSide(value: AnalysisRequest["playerSide"]) {
    setDraft((current) => ({
      ...current,
      playerSide: value,
    }));
  }

  function updatePlayerPosition(value: AnalysisRequest["playerPosition"]) {
    setDraft((current) => ({
      ...current,
      playerPosition: value,
    }));
  }

  async function submitPreparedRequest(preparedRequest: AnalysisRequest) {
    if (isSubmitting) {
      return;
    }

    const optimisticResult = preparedRequest.matchId.trim()
      ? saveAnalysisResult({
          request: preparedRequest,
          result: {
            conversation: buildReplayProcessingConversation(preparedRequest),
            warning: `录像正在后台处理，${REPLAY_PROCESSING_ESTIMATE}`,
            replayJob: null,
            matchSummary: null,
          },
        })
      : null;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preparedRequest),
      });

      let payload: AnalyzeApiResponse | null = null;

      try {
        payload = (await response.json()) as AnalyzeApiResponse;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        setFieldErrors(payload?.fieldErrors ?? {});
        setRequestError(payload?.error ?? "分析请求失败，请检查输入后重试。");
        if (optimisticResult) {
          saveAnalysisResult({
            id: optimisticResult.id,
            request: preparedRequest,
            result: {
              conversation: {
                ...optimisticResult.result.conversation,
                summary: "请求失败",
                messages: [
                  optimisticResult.result.conversation.messages[0],
                  {
                    id: "assistant-entry",
                    role: "assistant",
                    content:
                      payload?.error ??
                      "录像处理请求失败了。请稍后重试，或检查后端服务是否可用。",
                  },
                ],
              },
              warning: payload?.error ?? "录像处理请求失败。",
              replayJob: null,
              matchSummary: null,
            },
          });
        }
        return;
      }

      if (!payload) {
        setFieldErrors({});
        setRequestError("对话结果解析失败，请稍后再试。");
        if (optimisticResult) {
          saveAnalysisResult({
            id: optimisticResult.id,
            request: preparedRequest,
            result: {
              conversation: {
                ...optimisticResult.result.conversation,
                summary: "请求失败",
              },
              warning: "对话结果解析失败，请稍后再试。",
              replayJob: null,
              matchSummary: null,
            },
          });
        }
        return;
      }

      setFieldErrors({});
      setRequestError("");
      saveAnalysisResult({
        id: optimisticResult?.id,
        request: preparedRequest,
        result: {
          conversation: payload.conversation,
          warning: payload.warning,
          replayJob: payload.replayJob,
          matchSummary: payload.matchSummary,
        },
      });
    } catch {
      setFieldErrors({});
      setRequestError("暂时无法生成对话结果，请稍后再试。");
      if (optimisticResult) {
        saveAnalysisResult({
          id: optimisticResult.id,
          request: preparedRequest,
          result: {
            conversation: {
              ...optimisticResult.result.conversation,
              summary: "请求失败",
            },
            warning: "暂时无法连接后端，但这条对话已保留。请稍后重新加载这个比赛编号。",
            replayJob: null,
            matchSummary: null,
          },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitAnalysis() {
    await submitPreparedRequest(prepareSubmission(entryText, draft));
  }

  async function submitExamplePrompt(example: string) {
    setEntryText(example);
    await submitPreparedRequest(prepareSubmission(example, draft));
  }

  async function handleReplayLoad() {
    const replayId = replayLoaderValue.trim();

    if (!replayId) {
      return;
    }

    await submitPreparedRequest(
      prepareSubmission(replayId, {
        ...draft,
        focusQuestion: "",
      }),
    );
  }

  const sidebarToggleLabel = isSidebarCollapsed ? "展开侧栏" : "收起侧栏";

  return (
    <div
      className={`chat-app-shell chat-theme-notion chat-theme-cool ${
        isSidebarCollapsed ? "chat-app-shell-collapsed" : ""
      }`}
    >
      <aside className="chat-history-sidebar" aria-label="历史对话">
        <div className="chat-history-top">
          <div className="chat-history-header">
            <div className="chat-history-brand">
              <span className="chat-history-eyebrow">Replay Copilot</span>
              <h2 className="chat-history-heading">Ancient Lens</h2>
            </div>

            <button
              type="button"
              className="chat-history-toggle"
              aria-label={sidebarToggleLabel}
              aria-pressed={isSidebarCollapsed}
              title={sidebarToggleLabel}
              onClick={() => setIsSidebarCollapsed((current) => !current)}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen size={18} aria-hidden="true" />
              ) : (
                <PanelLeftClose size={18} aria-hidden="true" />
              )}
            </button>
          </div>

          {!isSidebarCollapsed ? (
            <div className="chat-history-action-stack">
              <div className="chat-history-action-panel">
                <button
                  type="button"
                  className="chat-history-new"
                  aria-label="新对话"
                  onClick={handleNewChat}
                >
                  <span>新对话</span>
                </button>
              </div>

              <form
                className="chat-history-loader chat-history-loader-panel"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleReplayLoad();
                }}
              >
                <span className="chat-history-section-label">录像载入</span>
                <label htmlFor="replay-loader-input" className="sr-only">
                  录像编号
                </label>
                <input
                  id="replay-loader-input"
                  aria-label="录像编号"
                  value={replayLoaderValue}
                  onChange={(event) => setReplayLoaderValue(event.target.value)}
                  className="chat-history-loader-input"
                  placeholder="输入录像编号"
                />
                <button
                  type="submit"
                  className="chat-history-loader-button"
                  disabled={isSubmitting || !replayLoaderValue.trim()}
                >
                  {isSubmitting ? "加载中..." : "加载录像"}
                </button>
              </form>
            </div>
          ) : null}
        </div>

        {!isSidebarCollapsed ? (
          <div className="chat-history-list-panel">
            <div className="chat-history-list-header">
              <span className="chat-history-section-label">最近对话</span>
              <span className="chat-history-count">{history.length}</span>
            </div>

            <div className="chat-history-list chat-history-scroll-region">
              {history.length ? (
                history.map((entry) => {
                  const active = currentResult?.id === entry.id;
                  const preview =
                    entry.result.conversation.summary.trim() ||
                    (entry.result.conversation.messages[0]?.content.slice(0, 80) +
                      "…") ||
                    "";

                  return (
                    <div
                      key={entry.id}
                      className={`chat-history-item ${
                        active ? "chat-history-item-active" : ""
                      }`}
                      onClick={() => selectAnalysisHistoryItem(entry.id)}
                    >
                      <button
                        type="button"
                        className="chat-history-item-content"
                        aria-label={buildHistoryLabel(entry.result.conversation.title)}
                        aria-current={active ? "true" : undefined}
                        title={buildHistoryLabel(entry.result.conversation.title)}
                        onClick={() => selectAnalysisHistoryItem(entry.id)}
                      >
                        <span className="chat-history-item-title">
                          {buildHistoryLabel(entry.result.conversation.title)}
                        </span>
                        <span className="chat-history-item-preview">{preview}</span>
                      </button>
                      <button
                        type="button"
                        className="chat-history-item-delete"
                        aria-label="删除对话"
                        title="删除对话"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteAnalysisHistoryItem(entry.id);
                        }}
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="chat-history-empty">还没有历史对话</div>
              )}
            </div>
          </div>
        ) : (
          <div className="chat-history-collapsed-hint">对话</div>
        )}
      </aside>

      <main className="chat-stage-main">
        {!hasHydrated ? (
          <section className="chat-stage-loading" aria-label="正在恢复对话">
            <div className="chat-stage-loading-copy">
              <span className="panel-kicker">Replay Chat</span>
              <p className="panel-copy panel-copy-wide">正在恢复对话</p>
            </div>
          </section>
        ) : currentResult ? (
          <ResultView
            request={currentResult.request}
            conversation={currentResult.result.conversation}
            warning={currentResult.result.warning}
            replayJob={currentResult.result.replayJob}
            matchSummary={currentResult.result.matchSummary}
            onConversationChange={(nextConversation, nextWarning, nextMeta) => {
              saveAnalysisResult({
                id: currentResult.id,
                request: currentResult.request,
                result: {
                  conversation: nextConversation,
                  warning: nextWarning ?? currentResult.result.warning,
                  replayJob:
                    nextMeta?.replayJob === undefined
                      ? currentResult.result.replayJob
                      : nextMeta.replayJob,
                  matchSummary:
                    nextMeta?.matchSummary === undefined
                      ? currentResult.result.matchSummary
                      : nextMeta.matchSummary,
                },
              });
            }}
          />
        ) : (
          <section className="chat-empty-stage" aria-label="分析入口">
            <header className="chat-empty-launch-brand">
              <span className="chat-empty-launch-eyebrow">DOTA 2 · REPLAY COPILOT</span>
              <h1 className="chat-empty-launch-title">Ancient Lens</h1>
              <p className="chat-empty-launch-tagline">
                粘贴比赛 ID 直接复盘，或问任何 Dota 问题 — 给你下一把先改的那一项。
              </p>
            </header>

            <form
              className="chat-minimal-launch-form"
              onSubmit={(event) => {
                event.preventDefault();
                void submitAnalysis();
              }}
            >
              <div className="search-row search-row-home">
                <label htmlFor="entry-input" className="sr-only">
                  {ENTRY_LABEL}
                </label>

                <div className="search-input-shell search-input-shell-home search-input-shell-home-minimal search-input-shell-home-minimal-flat search-input-shell-home-minimal-refined">
                  <div className="search-input-field-row search-input-field-row-minimal">
                    <Search size={18} className="search-icon" />
                    <input
                      id="entry-input"
                      aria-label={ENTRY_LABEL}
                      value={entryText}
                      onChange={(event) => setEntryText(event.target.value)}
                      className="search-input search-input-home search-input-home-minimal"
                      placeholder="输入比赛 ID，或直接提一个 Dota 问题"
                    />
                  </div>

                  <div className="search-input-actions">
                    <button
                      type="button"
                      aria-label={ADVANCED_OPTIONS_LABEL}
                      aria-expanded={showAdvanced}
                      onClick={() => setShowAdvanced((current) => !current)}
                      className={`icon-action-button icon-action-button-minimal ${
                        showAdvanced ? "icon-action-button-active" : ""
                      }`}
                      title={ADVANCED_OPTIONS_LABEL}
                    >
                      {showAdvanced ? <ChevronUp size={18} /> : <Settings2 size={18} />}
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || !entryText.trim()}
                      className="primary-button primary-button-home primary-button-home-minimal primary-button-home-minimal-balanced"
                    >
                      {isSubmitting ? "正在生成..." : "开始对话"}
                    </button>
                  </div>
                </div>
              </div>

              {requestError ? <div className="danger-banner">{requestError}</div> : null}

              {fieldErrors.focusQuestion?.[0] ? (
                <div className="danger-banner">{fieldErrors.focusQuestion[0]}</div>
              ) : null}

              {showAdvanced ? (
                <div className="advanced-panel advanced-panel-home advanced-panel-home-minimal chat-empty-settings-panel">
                  <div className="player-context-grid">
                    <label className="player-context-field">
                      <span className="form-label">{PLAYER_SIDE_LABEL}</span>
                      <select
                        aria-label={PLAYER_SIDE_LABEL}
                        value={draft.playerSide}
                        onChange={(event) =>
                          updatePlayerSide(
                            event.target.value as AnalysisRequest["playerSide"],
                          )
                        }
                        className="form-input player-context-select"
                      >
                        {PLAYER_SIDE_OPTIONS.map((option) => (
                          <option key={option.value || "unset"} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="player-context-field">
                      <span className="form-label">{PLAYER_POSITION_LABEL}</span>
                      <select
                        aria-label={PLAYER_POSITION_LABEL}
                        value={draft.playerPosition}
                        onChange={(event) =>
                          updatePlayerPosition(
                            event.target.value as AnalysisRequest["playerPosition"],
                          )
                        }
                        className="form-input player-context-select"
                      >
                        {PLAYER_POSITION_OPTIONS.map((option) => (
                          <option key={option.value || "unset"} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="form-label">{FOCUS_QUESTION_LABEL}</span>
                    <textarea
                      aria-label={FOCUS_QUESTION_LABEL}
                      value={draft.focusQuestion}
                      onChange={(event) => updateFocusQuestion(event.target.value)}
                      className="form-input form-textarea form-input-home-minimal"
                      placeholder="例如：这局为什么会输在 Roshan 前后，或下一把先改什么？"
                    />
                  </label>
                </div>
              ) : null}
            </form>

            <aside
              className="chat-empty-examples"
              aria-label="示例问题"
            >
              <span className="chat-empty-examples-label">试试这样问</span>
              <div className="chat-empty-examples-row">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="chat-empty-example"
                    onClick={() => void submitExamplePrompt(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
