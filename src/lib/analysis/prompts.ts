import type { AnalysisRequest } from "@/lib/analysis/schema";

export type PromptBundle = {
  system: string;
  user: string;
  responseShape: string;
};

const audienceInstructions = {
  "solo-player":
    "The current user is a solo ranked player. Prioritize rank climbing clarity, repeated habits, and 1-3 drills they can use in the next queue.",
  coach:
    "The current user is a team coach or captain. Prioritize team coordination, map slicing, objective setup, and what should be discussed in the review room.",
  creator:
    "The current user is a content creator. Prioritize storyline, highlight clips, audience-facing phrasing, and what moments deserve a clean narrative arc.",
} as const;

const modeInstructions = {
  "quick-scan":
    "Keep the answer highly scannable. Surface the biggest three problems first, then support them with concise evidence.",
  "ranked-coaching":
    "Coach like a high-level ranked reviewer. Tie each issue to a correction loop the player can repeat next match.",
  "team-review":
    "Structure the response like a serious team review. Emphasize chain reactions between lanes, vision, objective setup, and fight entry timing.",
  "content-breakdown":
    "Structure the response like an analyst preparing an episode. Pull out storyline hooks, tension swings, and audience-friendly beats.",
  "deep-thinking":
    "Use the deepest available evidence. Prioritize model-backed win probability drops, duration extension windows, and careful causal hypotheses.",
} as const;

const toneInstructions = {
  balanced: "Use an honest but supportive tone.",
  direct: "Use a direct coaching tone without sounding hostile.",
  blunt: "Be sharp and plain-spoken, but still constructive.",
  broadcast: "Use a polished desk-analyst tone with strong pacing.",
} as const;

export const analysisResponseShape = `Return strict JSON only. Use this shape:
{
  "summary": {
    "headline": "string",
    "overview": "string",
    "verdict": "string",
    "confidence": "high | medium | low"
  },
  "priorityIssues": [
    {
      "title": "string",
      "description": "string",
      "whyItMatters": "string",
      "nextMove": "string"
    }
  ],
  "phaseBreakdown": [
    {
      "phase": "string",
      "verdict": "string",
      "takeaways": ["string", "string"],
      "winCondition": "string"
    }
  ],
  "keyMoments": [
    {
      "time": "string",
      "title": "string",
      "whatHappened": "string",
      "whyItMatters": "string",
      "adjustment": "string"
    }
  ],
  "practicePlan": [
    {
      "title": "string",
      "duration": "string",
      "steps": ["string", "string"]
    }
  ],
  "audienceAddOn": {
    "title": "string",
    "summary": "string",
    "bullets": ["string", "string"]
  }
}`;

export const quickQuestionResponseShape = `Return strict JSON only. Use this shape:
{
  "headline": "string",
  "answer": "string",
  "takeaways": ["string", "string", "string"],
  "pitfalls": ["string", "string"],
  "practiceFocus": "string"
}`;

function formatOptionalLine(label: string, value: string) {
  if (!value.trim()) {
    return null;
  }

  return `- ${label}: ${value}`;
}

function formatPlayerSide(value: AnalysisRequest["playerSide"]) {
  if (value === "radiant") {
    return "Radiant / 天辉";
  }

  if (value === "dire") {
    return "Dire / 夜魇";
  }

  return "";
}

function formatPlayerPosition(value: AnalysisRequest["playerPosition"]) {
  return value ? `${value}号位` : "";
}

function formatTimeline(input: AnalysisRequest) {
  if (!input.timeline.length) {
    return "- No explicit timeline events were supplied.";
  }

  return input.timeline
    .map(
      (event, index) =>
        `${index + 1}. ${event.time} | ${event.title} | ${event.tag} | ${event.impact}`,
    )
    .join("\n");
}

export function buildAnalysisPrompt(input: AnalysisRequest): PromptBundle {
  const system = [
    "You are a Dota 2 replay analysis agent for VOD reviews, manual replay notes, and observer transcripts.",
    audienceInstructions[input.audience],
    modeInstructions[input.mode],
    toneInstructions[input.desiredTone],
    "Never pretend you saw details that were not supplied.",
    "If the evidence is thin, explicitly lower confidence instead of inventing certainty.",
    "Tie every important claim to replay evidence, timestamps, or a clearly labeled inference.",
    "Always turn criticism into a practical next action.",
    "Respond in Simplified Chinese.",
  ].join("\n");

  const user = [
    "Replay Context",
    `- Audience: ${input.audience}`,
    `- Mode: ${input.mode}`,
    formatOptionalLine("Match ID", input.matchId),
    `- Focus Question: ${input.focusQuestion}`,
    formatOptionalLine("Context Summary", input.contextSummary),
    formatOptionalLine("Skill Bracket", input.skillBracket),
    formatOptionalLine("Role", input.role),
    formatOptionalLine("Player Side", formatPlayerSide(input.playerSide)),
    formatOptionalLine("Player Position", formatPlayerPosition(input.playerPosition)),
    formatOptionalLine("Lane Or Review Lens", input.lane),
    formatOptionalLine("Match Title", input.matchTitle),
    formatOptionalLine("Patch", input.patch),
    formatOptionalLine("Draft Summary", input.draftSummary),
    formatOptionalLine("Lane Outcome", input.laneOutcome),
    formatOptionalLine("Replay Notes", input.replayNotes),
    formatOptionalLine("Observer Transcript", input.transcript),
    "",
    "Timeline",
    formatTimeline(input),
    "",
    "Output Expectations",
    "- Give one clear headline and verdict.",
    "- Surface exactly three priority issues.",
    "- Cover phase breakdown, key moments, and a repeatable practice plan.",
    "- Tailor the final add-on to the selected audience.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    system,
    user,
    responseShape: analysisResponseShape,
  };
}

export function buildQuickQuestionPrompt(input: AnalysisRequest): PromptBundle {
  const system = [
    "You are a Dota 2 gameplay coach answering standalone questions.",
    audienceInstructions[input.audience],
    toneInstructions[input.desiredTone],
    "Answer in a practical, conversational way.",
    "Do not pretend to have replay evidence when the user asked a general gameplay question.",
    "Prioritize concise principles, common mistakes, and the next thing to practice.",
    "Respond in Simplified Chinese.",
  ].join("\n");

  const user = [
    "Gameplay Question",
    `- Audience: ${input.audience}`,
    formatOptionalLine("Question", input.focusQuestion),
    formatOptionalLine("Extra Context", input.contextSummary),
    formatOptionalLine("Skill Bracket", input.skillBracket),
    formatOptionalLine("Role", input.role),
    formatOptionalLine("Player Side", formatPlayerSide(input.playerSide)),
    formatOptionalLine("Player Position", formatPlayerPosition(input.playerPosition)),
    formatOptionalLine("Patch", input.patch),
    "",
    "Output Expectations",
    "- Lead with one clear conclusion.",
    "- Give exactly three takeaways.",
    "- Name two or three common pitfalls.",
    "- End with one practice focus.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    system,
    user,
    responseShape: quickQuestionResponseShape,
  };
}
