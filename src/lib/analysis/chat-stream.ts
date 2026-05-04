import type {
  AnalysisConversation,
  DeepThinkingInsight,
  MatchSummary,
  ReplayPreparation,
} from "@/lib/analysis/schema";

export type AnalyzeStreamPayload = {
  answer?: string;
  text?: string;
  conversation?: AnalysisConversation;
  followUps?: AnalysisConversation["followUps"];
  followupQuestions?: string[];
  clickOptions?: Array<{
    label?: string;
    question?: string;
  }>;
  recommendations?: Array<{
    title?: string;
    detail?: string;
  }>;
  warning?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  replayJob?: ReplayPreparation | null;
  matchSummary?: MatchSummary | null;
  deepThinking?: DeepThinkingInsight | null;
};

export type AnalyzeStreamEvent =
  | { type: "delta"; text: string; payload: AnalyzeStreamPayload }
  | { type: "final"; answer?: string; payload: AnalyzeStreamPayload }
  | { type: "preparation"; payload: AnalyzeStreamPayload }
  | { type: "error"; payload: AnalyzeStreamPayload }
  | { type: "done"; payload: AnalyzeStreamPayload }
  | { type: "unknown"; eventName: string; payload: AnalyzeStreamPayload };

type StreamHandlers = {
  onEvent: (event: AnalyzeStreamEvent) => void | Promise<void>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function normalizeStringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeFollowUps(value: unknown): AnalysisConversation["followUps"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return {
          question: item,
          answer: "",
        };
      }

      if (!isRecord(item)) {
        return null;
      }

      const question = getString(item.question) ?? getString(item.label);
      const answer =
        getString(item.answer) ??
        getString(item.detail) ??
        "";

      return question
        ? {
            question,
            answer,
          }
        : null;
    })
    .filter((item): item is AnalysisConversation["followUps"][number] =>
      Boolean(item),
    );
}

function normalizeClickOptions(
  value: unknown,
): NonNullable<AnalyzeStreamPayload["clickOptions"]> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) =>
    isRecord(item)
      ? [
          {
            label: getString(item.label),
            question: getString(item.question),
          },
        ]
      : [],
  );
}

function normalizeRecommendations(
  value: unknown,
): NonNullable<AnalyzeStreamPayload["recommendations"]> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) =>
    isRecord(item)
      ? [
          {
            title: getString(item.title),
            detail: getString(item.detail),
          },
        ]
      : [],
  );
}

function parseEventData(rawData: string): unknown {
  if (!rawData.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawData);
  } catch {
    return rawData;
  }
}

export function normalizeAnalyzeStreamPayload(rawPayload: unknown): AnalyzeStreamPayload {
  if (typeof rawPayload === "string") {
    return {
      answer: rawPayload,
      text: rawPayload,
    };
  }

  if (!isRecord(rawPayload)) {
    return {};
  }

  const replayJob =
    rawPayload.replayJob ?? rawPayload.replay_job ?? rawPayload.job ?? null;
  const matchSummary = rawPayload.matchSummary ?? rawPayload.match_summary ?? null;
  const deepThinking = rawPayload.deepThinking ?? rawPayload.deep_thinking ?? null;
  const followUps = normalizeFollowUps(rawPayload.followUps ?? rawPayload.followups);
  const followupQuestions = normalizeStringList(
    rawPayload.followupQuestions ?? rawPayload.followup_questions,
  );
  const clickOptions = normalizeClickOptions(
    rawPayload.clickOptions ?? rawPayload.click_options,
  );
  const recommendations = normalizeRecommendations(rawPayload.recommendations);

  return {
    answer:
      getString(rawPayload.answer) ??
      getString(rawPayload.fullAnswer) ??
      getString(rawPayload.text) ??
      getString(rawPayload.content) ??
      getString(rawPayload.message),
    text:
      getString(rawPayload.text) ??
      getString(rawPayload.delta) ??
      getString(rawPayload.answer),
    conversation: isRecord(rawPayload.conversation)
      ? (rawPayload.conversation as AnalysisConversation)
      : undefined,
    followUps,
    followupQuestions,
    clickOptions,
    recommendations,
    warning:
      getString(rawPayload.warning) ??
      getString(rawPayload.detail) ??
      getString(rawPayload.status),
    error: getString(rawPayload.error) ?? getString(rawPayload.message),
    fieldErrors: isRecord(rawPayload.fieldErrors)
      ? (rawPayload.fieldErrors as Record<string, string[] | undefined>)
      : undefined,
    replayJob: isRecord(replayJob) ? (replayJob as ReplayPreparation) : null,
    matchSummary: isRecord(matchSummary) ? (matchSummary as MatchSummary) : null,
    deepThinking: isRecord(deepThinking)
      ? (deepThinking as DeepThinkingInsight)
      : null,
  };
}

export function buildStreamingFollowUps({
  payload,
  question,
}: {
  payload?: AnalyzeStreamPayload | null;
  question: string;
}): AnalysisConversation["followUps"] {
  const fromConversation = payload?.conversation?.followUps ?? [];
  const fromFollowUps = payload?.followUps ?? [];
  const fromQuestions =
    payload?.followupQuestions?.map((item) => ({
      question: item,
      answer: "",
    })) ?? [];
  const fromClickOptions =
    payload?.clickOptions
      ?.map((item) =>
        item.question
          ? {
              question: item.question,
              answer: item.label ?? "",
            }
          : null,
      )
      .filter((item): item is AnalysisConversation["followUps"][number] =>
        Boolean(item),
      ) ?? [];
  const fromRecommendations =
    payload?.recommendations
      ?.map((item) =>
        item.title
          ? {
              question: item.title,
              answer: item.detail ?? "",
            }
          : null,
      )
      .filter((item): item is AnalysisConversation["followUps"][number] =>
        Boolean(item),
      ) ?? [];

  const candidates = [
    ...fromConversation,
    ...fromFollowUps,
    ...fromClickOptions,
    ...fromQuestions,
    ...fromRecommendations,
  ];
  const seen = new Set<string>();

  return candidates
    .filter((item) => {
      const normalized = item.question.trim();
      if (!normalized || normalized === question.trim() || seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    })
    .map((item) => ({
      question: item.question,
      answer: item.answer,
    }))
    .slice(0, 3);
}

function normalizeEvent(eventName: string, rawPayload: unknown): AnalyzeStreamEvent {
  const payload = normalizeAnalyzeStreamPayload(rawPayload);
  const type = eventName === "message" && isRecord(rawPayload)
    ? getString(rawPayload.event) ?? getString(rawPayload.type) ?? eventName
    : eventName;

  if (type === "delta") {
    return {
      type,
      text: payload.text ?? payload.answer ?? "",
      payload,
    };
  }

  if (type === "final") {
    return {
      type,
      answer: payload.answer ?? payload.text,
      payload,
    };
  }

  if (type === "preparation" || type === "error" || type === "done") {
    return { type, payload } as AnalyzeStreamEvent;
  }

  return { type: "unknown", eventName: type, payload };
}

async function dispatchSseEvent(
  eventName: string,
  dataLines: string[],
  handlers: StreamHandlers,
) {
  const rawPayload = parseEventData(dataLines.join("\n"));
  const event = normalizeEvent(eventName, rawPayload);
  await handlers.onEvent(event);
  return event;
}

export async function readAnalyzeResponseEvents(
  response: Response,
  handlers: StreamHandlers,
) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.body || !contentType.includes("text/event-stream")) {
    const payload = normalizeAnalyzeStreamPayload(await response.json().catch(() => null));
    await handlers.onEvent({
      type: response.ok ? "final" : "error",
      answer: payload.answer ?? payload.text,
      payload,
    });
    await handlers.onEvent({ type: "done", payload: {} });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";
  let dataLines: string[] = [];
  let shouldStop = false;

  const processLine = async (line: string) => {
    if (!line) {
      if (dataLines.length) {
        const event = await dispatchSseEvent(eventName, dataLines, handlers);
        shouldStop = event.type === "done";
      }
      eventName = "message";
      dataLines = [];
      return;
    }

    if (line.startsWith(":")) {
      return;
    }

    const separatorIndex = line.indexOf(":");
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
    const rawValue = separatorIndex === -1 ? "" : line.slice(separatorIndex + 1);
    const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;

    if (field === "event") {
      eventName = value || "message";
    }

    if (field === "data") {
      dataLines.push(value);
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      await processLine(line);
      if (shouldStop) {
        await reader.cancel().catch(() => undefined);
        return;
      }
    }

    if (done) {
      break;
    }
  }

  if (buffer) {
    await processLine(buffer);
    if (shouldStop) {
      await reader.cancel().catch(() => undefined);
      return;
    }
  }

  if (dataLines.length) {
    await dispatchSseEvent(eventName, dataLines, handlers);
  }
}
