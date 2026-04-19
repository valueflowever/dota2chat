import type { AnalysisConversationMode } from "@/lib/analysis/schema";

export function isReplayId(value: string) {
  return /^\d{8,12}$/.test(value.trim());
}

export function detectAnalysisInput(value: string): {
  mode: AnalysisConversationMode;
  normalizedValue: string;
} {
  const normalizedValue = value.trim();

  if (isReplayId(normalizedValue)) {
    return {
      mode: "match-replay",
      normalizedValue,
    };
  }

  return {
    mode: "game-question",
    normalizedValue,
  };
}
