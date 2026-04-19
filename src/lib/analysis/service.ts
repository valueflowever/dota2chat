import OpenAI from "openai";

import {
  buildQuickQuestionAnswer,
  buildQuickQuestionConversation,
  buildReplayConversation,
  quickQuestionAnswerSchema,
} from "@/lib/analysis/conversation";
import { detectAnalysisInput } from "@/lib/analysis/input-mode";
import { analyzeReplayLocally } from "@/lib/analysis/local-engine";
import {
  buildAnalysisPrompt,
  buildQuickQuestionPrompt,
} from "@/lib/analysis/prompts";
import {
  analysisReportPayloadSchema,
  analysisReportSchema,
  type AnalysisConversation,
  type AnalysisReport,
  type AnalysisRequest,
} from "@/lib/analysis/schema";

export type AnalyzeReplayResult = {
  conversation: AnalysisConversation;
  warning?: string;
};

function extractJsonObject(raw: string) {
  const trimmed = raw.trim().replace(/^```json/i, "").replace(/```$/i, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Model did not return a JSON object.");
  }

  return JSON.parse(trimmed.slice(start, end + 1));
}

async function analyzeReportWithOpenAI(
  input: AnalysisRequest,
): Promise<AnalysisReport> {
  const prompt = buildAnalysisPrompt(input);
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.2",
    instructions: `${prompt.system}\n${prompt.responseShape}`,
    input: prompt.user,
  });

  const parsed = analysisReportPayloadSchema.parse(
    extractJsonObject(response.output_text),
  );

  return analysisReportSchema.parse({
    ...parsed,
    source: "live-ai",
    generatedAt: new Date().toISOString(),
  });
}

async function answerQuickQuestionWithOpenAI(input: AnalysisRequest) {
  const prompt = buildQuickQuestionPrompt(input);
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.2",
    instructions: `${prompt.system}\n${prompt.responseShape}`,
    input: prompt.user,
  });

  return quickQuestionAnswerSchema.parse(extractJsonObject(response.output_text));
}

export async function analyzeReplay(
  input: AnalysisRequest,
): Promise<AnalyzeReplayResult> {
  const analysisMode = detectAnalysisInput(input.matchId || input.focusQuestion).mode;

  if (analysisMode === "match-replay" && input.matchId.trim()) {
    if (!process.env.OPENAI_API_KEY) {
      const report = await analyzeReplayLocally(input);

      return {
        conversation: buildReplayConversation(input, report),
      };
    }

    try {
      const report = await analyzeReportWithOpenAI(input);

      return {
        conversation: buildReplayConversation(input, report),
      };
    } catch (error) {
      const fallbackReport = await analyzeReplayLocally(input);
      const message =
        error instanceof Error
          ? error.message
          : "OpenAI analysis failed, switched to demo mode.";

      return {
        conversation: buildReplayConversation(input, fallbackReport),
        warning: `OpenAI 实时分析暂时不可用，已切换到本地演示模式。${message}`,
      };
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      conversation: buildQuickQuestionConversation(
        input,
        buildQuickQuestionAnswer(input),
        "demo-engine",
      ),
    };
  }

  try {
    const answer = await answerQuickQuestionWithOpenAI(input);

    return {
      conversation: buildQuickQuestionConversation(input, answer, "live-ai"),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "OpenAI question answer failed, switched to demo mode.";

    return {
      conversation: buildQuickQuestionConversation(
        input,
        buildQuickQuestionAnswer(input),
        "demo-engine",
      ),
      warning: `OpenAI 实时回答暂时不可用，已切换到本地演示模式。${message}`,
    };
  }
}
