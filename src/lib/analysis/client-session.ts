import type {
  AnalysisConversation,
  AnalysisRequest,
  MatchSummary,
  ReplayPreparation,
} from "@/lib/analysis/schema";

export const ANALYSIS_DRAFT_KEY = "ancient-lens-analysis-draft";
export const ANALYSIS_RESULT_KEY = "ancient-lens-analysis-result";
export const ANALYSIS_HISTORY_KEY = "ancient-lens-analysis-history";
const ANALYSIS_RESULT_EVENT = "ancient-lens-analysis-result-change";

export type StoredDraftState = {
  draft: AnalysisRequest;
  entryText?: string;
  showAdvanced: boolean;
};

export type StoredAnalysisResult = {
  id: string;
  request: AnalysisRequest;
  result: {
    conversation: AnalysisConversation;
    warning?: string;
    replayJob?: ReplayPreparation | null;
    matchSummary?: MatchSummary | null;
  };
};

function readFromSessionStorage<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeToSessionStorage(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
}

function writeToLocalStorage(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function readAnalysisResultRaw() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.localStorage.getItem(ANALYSIS_RESULT_KEY) ??
    window.sessionStorage.getItem(ANALYSIS_RESULT_KEY)
  );
}

function readAnalysisHistoryRaw() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ANALYSIS_HISTORY_KEY);
}

function buildAnalysisPreview(value: StoredAnalysisResult) {
  return {
    title:
      value.result.conversation.title ||
      value.request.matchId ||
      value.request.focusQuestion,
    updatedAt: value.result.conversation.generatedAt,
    preview:
      value.result.conversation.messages[value.result.conversation.messages.length - 1]
        ?.content || "",
  };
}

export function loadDraftState() {
  return readFromSessionStorage<StoredDraftState>(ANALYSIS_DRAFT_KEY);
}

export function saveDraftState(value: StoredDraftState) {
  writeToSessionStorage(ANALYSIS_DRAFT_KEY, value);
}

let cachedAnalysisResultRaw: string | null | undefined;
let cachedAnalysisResultValue: StoredAnalysisResult | null = null;
let cachedAnalysisHistoryRaw: string | null | undefined;
let cachedAnalysisHistoryValue: StoredAnalysisResult[] = [];

export function getAnalysisResultSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = readAnalysisResultRaw();

  if (raw === cachedAnalysisResultRaw) {
    return cachedAnalysisResultValue;
  }

  cachedAnalysisResultRaw = raw;

  if (!raw) {
    cachedAnalysisResultValue = null;
    return cachedAnalysisResultValue;
  }

  try {
    cachedAnalysisResultValue = JSON.parse(raw) as StoredAnalysisResult;
  } catch {
    cachedAnalysisResultValue = null;
  }

  return cachedAnalysisResultValue;
}

export function getAnalysisHistorySnapshot() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = readAnalysisHistoryRaw();

  if (raw === cachedAnalysisHistoryRaw) {
    return cachedAnalysisHistoryValue;
  }

  cachedAnalysisHistoryRaw = raw;

  if (!raw) {
    cachedAnalysisHistoryValue = [];
    return cachedAnalysisHistoryValue;
  }

  try {
    cachedAnalysisHistoryValue = JSON.parse(raw) as StoredAnalysisResult[];
  } catch {
    cachedAnalysisHistoryValue = [];
  }

  return cachedAnalysisHistoryValue;
}

export function subscribeAnalysisResult(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => callback();

  window.addEventListener(ANALYSIS_RESULT_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(ANALYSIS_RESULT_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function dispatchAnalysisEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ANALYSIS_RESULT_EVENT));
  }
}

function writeAnalysisCaches(
  current: StoredAnalysisResult | null,
  history: StoredAnalysisResult[],
) {
  cachedAnalysisResultRaw = current ? JSON.stringify(current) : null;
  cachedAnalysisResultValue = current;
  cachedAnalysisHistoryRaw = JSON.stringify(history);
  cachedAnalysisHistoryValue = history;
}

function upsertHistoryEntry(history: StoredAnalysisResult[], value: StoredAnalysisResult) {
  return [value, ...history.filter((entry) => entry.id !== value.id)].slice(0, 24);
}

function createStoredResultId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function clearCurrentAnalysisResult() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ANALYSIS_RESULT_KEY);
  window.sessionStorage.removeItem(ANALYSIS_RESULT_KEY);
  writeAnalysisCaches(null, getAnalysisHistorySnapshot());
  dispatchAnalysisEvent();
}

export function deleteAnalysisHistoryItem(id: string) {
  if (typeof window === "undefined") {
    return;
  }

  const history = getAnalysisHistorySnapshot().filter((entry) => entry.id !== id);
  const currentResult = getAnalysisResultSnapshot();

  let nextCurrentResult = currentResult;

  if (currentResult?.id === id) {
    window.localStorage.removeItem(ANALYSIS_RESULT_KEY);
    window.sessionStorage.removeItem(ANALYSIS_RESULT_KEY);
    nextCurrentResult = null;
  }

  writeToLocalStorage(ANALYSIS_HISTORY_KEY, history);
  writeAnalysisCaches(nextCurrentResult, history);
  dispatchAnalysisEvent();
}

export function selectAnalysisHistoryItem(id: string) {
  const history = getAnalysisHistorySnapshot();
  const match = history.find((entry) => entry.id === id) ?? null;

  if (!match) {
    return null;
  }

  writeToLocalStorage(ANALYSIS_RESULT_KEY, match);
  writeToSessionStorage(ANALYSIS_RESULT_KEY, match);
  writeAnalysisCaches(match, history);
  dispatchAnalysisEvent();

  return match;
}

export function saveAnalysisResult(
  value: Omit<StoredAnalysisResult, "id"> & { id?: string },
) {
  const nextValue: StoredAnalysisResult = {
    ...value,
    id: value.id ?? createStoredResultId(),
  };
  const history = upsertHistoryEntry(getAnalysisHistorySnapshot(), nextValue);

  writeToLocalStorage(ANALYSIS_RESULT_KEY, nextValue);
  writeToSessionStorage(ANALYSIS_RESULT_KEY, nextValue);
  writeToLocalStorage(ANALYSIS_HISTORY_KEY, history);
  writeAnalysisCaches(nextValue, history);

  if (typeof window !== "undefined") {
    const title = buildAnalysisPreview(nextValue).title;
    document.title = title ? `${title} | Dota 2 复盘对话台` : document.title;
  }

  dispatchAnalysisEvent();

  return nextValue;
}
