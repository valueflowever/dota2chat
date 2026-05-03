import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResultView } from "@/components/workspace/result-view";
import type { AnalysisConversation, AnalysisRequest } from "@/lib/analysis/schema";

const baseRequest: AnalysisRequest = {
  audience: "solo-player",
  mode: "ranked-coaching",
  matchId: "8724913167",
  focusQuestion: "请分析这场比赛的整体节奏、关键转折点，以及下一把最值得优先修正的一项动作。",
  contextSummary: "",
  skillBracket: "",
  role: "",
  playerSide: "",
  playerPosition: "",
  lane: "",
  matchTitle: "",
  patch: "",
  draftSummary: "",
  laneOutcome: "",
  replayNotes: "",
  transcript: "",
  desiredTone: "balanced",
  timeline: [],
};

const matchConversation: AnalysisConversation = {
  mode: "match-replay",
  title: "比赛 8724913167",
  summary: "首轮复盘",
  source: "demo-engine",
  generatedAt: "2026-04-06T00:00:00.000Z",
  messages: [
    {
      id: "user-entry",
      role: "user",
      content: "8724913167",
    },
    {
      id: "assistant-entry",
      role: "assistant",
      content:
        "先说结论：这局不是纯操作没打过，而是 Roshan 前后的节奏管理断了。下一把先把边线、站位和第一拍口令固定下来。",
    },
  ],
  followUps: [
    {
      question: "这局为什么会输？",
      answer: "因为你们每次进关键区域前都少了一层准备，到了 Roshan 才集中爆掉。",
    },
    {
      question: "我最大的失误是什么？",
      answer: "最大的失误不是某一拍按慢了，而是把关键资源点当成临场反应题去打。",
    },
    {
      question: "下一把先改什么？",
      answer: "先只改一个习惯：每次准备接目标前，先口头确认边线、视野和谁先手。",
    },
    {
      question: "有哪些关键时间点？",
      answer: "先回看 16:52、27:23 和 28:29，这三段最能解释整局是怎么翻掉的。",
    },
  ],
};

function createFollowUpResponse(answer: string) {
  return new Response(
    JSON.stringify({
      conversation: {
        ...matchConversation,
        messages: [
          ...matchConversation.messages,
          {
            id: `assistant-${answer}`,
            role: "assistant",
            content: answer,
          },
        ],
        followUps: matchConversation.followUps,
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  ) as unknown as Response;
}

describe("ResultView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the analysis result as a polished chat layout with context chips", () => {
    const { container } = render(
      <ResultView
        request={baseRequest}
        conversation={matchConversation}
        warning="分析服务提示"
      />,
    );

    expect(screen.getByText("8724913167")).toBeInTheDocument();
    expect(screen.getByText(/先说结论：这局不是纯操作没打过/u)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "比赛 8724913167" })).toBeInTheDocument();
    expect(screen.getByText("首轮复盘")).toBeInTheDocument();
    expect(screen.getByText("当前分析")).toBeInTheDocument();
    expect(screen.getByText("录像复盘")).toBeInTheDocument();
    expect(screen.queryByText("本地兜底")).toBeNull();
    expect(screen.queryByText("AI 教练")).toBeNull();
    expect(screen.getByRole("button", { name: "这局为什么会输？" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一把先改什么？" })).toBeInTheDocument();
    expect(screen.getByLabelText("继续追问")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发送" })).toBeInTheDocument();
    expect(screen.getByText("分析服务提示")).toBeInTheDocument();
    expect(container.querySelector(".analysis-chat-app")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-app-theme-notion")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-app-theme-cool")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-document")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-header")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-header-copy")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-thread-stage")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-hero")).toBeNull();
    expect(container.querySelector(".analysis-chat-message-accent")).toBeNull();
    expect(container.querySelector(".analysis-chat-composer-bar")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-suggestion-strip")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-composer-shell")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-suggestion-panel")).toBeNull();
    expect(container.querySelector(".analysis-chat-composer-panel")).toBeNull();
    expect(container.querySelector(".analysis-chat-message-block-assistant")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-message-block-user")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-message-block-user-compact")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-row-user-compact")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-message-block-user-expanded")).toBeNull();
    expect(container.querySelector(".analysis-chat-row-user-wide")).toBeNull();
    expect(container.querySelector(".analysis-chat-context")).not.toBeNull();
    expect(container.querySelector(".analysis-thread-shell")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-dock")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-composer")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-dock-blended")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-dock-integrated")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-composer-bar-subtle")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-composer-bar-integrated")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-input-tall")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-input-taller")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-send-muted")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-send-soft")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-suggestions")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-suggestion-block")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-suggestion-head")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-suggestion-question")).not.toBeNull();
    expect(container.querySelector(".analysis-chat-suggestion-preview")).not.toBeNull();
    expect(screen.getByText("下一步方案")).toBeInTheDocument();
    expect(screen.getByText("方案 1")).toBeInTheDocument();
    expect(screen.queryByText("关键事件速览")).not.toBeInTheDocument();
    expect(screen.queryByText("阶段复盘矩阵")).not.toBeInTheDocument();
  });

  it("sends a suggested question as a real chat turn", async () => {
    const user = userEvent.setup();
    const targetFollowUp = matchConversation.followUps[1];
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      createFollowUpResponse("backend answer for suggested question"),
    );

    render(<ResultView request={baseRequest} conversation={matchConversation} />);

    await user.click(screen.getByRole("button", { name: targetFollowUp.question }));

    await waitFor(() => {
      expect(screen.getByText("backend answer for suggested question")).toBeInTheDocument();
    });

    expect(screen.getAllByText(targetFollowUp.question)).toHaveLength(2);
    expect(screen.getByText(targetFollowUp.answer)).toHaveClass(
      "analysis-chat-suggestion-preview",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const firstRequest = fetchMock.mock.calls[0]?.[1];
    const requestBody =
      typeof firstRequest === "object" && firstRequest && "body" in firstRequest
        ? JSON.parse(String(firstRequest.body))
        : null;

    expect(requestBody.matchId).toBe("8724913167");
    expect(requestBody.focusQuestion).toBe(targetFollowUp.question);
    expect(requestBody.contextSummary).toContain("连续追问");
    expect(requestBody.contextSummary).toContain("先说结论");
    expect(requestBody.contextSummary).toContain(targetFollowUp.question);
  });

  it("does not reuse message keys when the same suggested question is sent twice", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const targetFollowUp = matchConversation.followUps[1];

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(createFollowUpResponse("backend answer 1"))
      .mockResolvedValueOnce(createFollowUpResponse("backend answer 2"));

    render(<ResultView request={baseRequest} conversation={matchConversation} />);

    await user.click(screen.getByRole("button", { name: targetFollowUp.question }));

    await waitFor(() => {
      expect(screen.getByText("backend answer 1")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: targetFollowUp.question }));

    await waitFor(() => {
      expect(screen.getByText("backend answer 2")).toBeInTheDocument();
    });

    expect(screen.getAllByText(targetFollowUp.question)).toHaveLength(3);
    expect(
      consoleErrorSpy.mock.calls.some((call) =>
        call.some(
          (value) =>
            typeof value === "string" &&
            value.includes("Encountered two children with the same key"),
        ),
      ),
    ).toBe(false);
  });

  it("sanitizes duplicate message ids from an incoming stored conversation", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ResultView
        request={baseRequest}
        conversation={{
          ...matchConversation,
          messages: [
            {
              id: "follow-up-我最大的失误是什么？-user",
              role: "user",
              content: "我最大的失误是什么？",
            },
            {
              id: "follow-up-我最大的失误是什么？-assistant",
              role: "assistant",
              content: "最大的失误不是某一拍按慢了，而是把关键资源点当成临场反应题去打。",
            },
            {
              id: "follow-up-我最大的失误是什么？-user",
              role: "user",
              content: "我最大的失误是什么？",
            },
            {
              id: "follow-up-我最大的失误是什么？-assistant",
              role: "assistant",
              content: "最大的失误不是某一拍按慢了，而是把关键资源点当成临场反应题去打。",
            },
          ],
        }}
      />,
    );

    expect(screen.getAllByText("我最大的失误是什么？").length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getAllByText("最大的失误不是某一拍按慢了，而是把关键资源点当成临场反应题去打。").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      consoleErrorSpy.mock.calls.some((call) =>
        call.some(
          (value) =>
            typeof value === "string" &&
            value.includes("Encountered two children with the same key"),
        ),
      ),
    ).toBe(false);
  });

  it("normalizes legacy array-string assistant messages before rendering", () => {
    render(
      <ResultView
        request={baseRequest}
        conversation={{
          ...matchConversation,
          messages: [
            matchConversation.messages[0],
            {
              id: "assistant-array-string",
              role: "assistant",
              content: "['一、已确认的硬证据', '', '- 比分 18:37，时长 29:37。']",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("一、已确认的硬证据")).toBeInTheDocument();
    expect(screen.getByText("18:37")).toBeInTheDocument();
    expect(screen.getByText("29:37")).toBeInTheDocument();
    expect(screen.queryByText(/^\['一、已确认/u)).toBeNull();
  });

  it("submits a typed follow-up through the analysis API and appends the response", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          conversation: {
            ...matchConversation,
            messages: [
              {
                id: "user-entry",
                role: "user",
                content: "这局高地前到底哪里脱节了？",
              },
              {
                id: "assistant-entry",
                role: "assistant",
                content: "高地前真正脱节的是前排已经想上，后排的保护和第二拍还没就位。",
              },
            ],
            followUps: matchConversation.followUps,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ) as unknown as Response,
    );

    render(<ResultView request={baseRequest} conversation={matchConversation} />);

    await user.type(screen.getByLabelText("继续追问"), "这局高地前到底哪里脱节了？");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => {
      expect(
        screen.getByText("高地前真正脱节的是前排已经想上，后排的保护和第二拍还没就位。"),
      ).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const firstRequest = fetchMock.mock.calls[0]?.[1];
    const requestBody =
      typeof firstRequest === "object" && firstRequest && "body" in firstRequest
        ? JSON.parse(String(firstRequest.body))
        : null;

    expect(requestBody.matchId).toBe("8724913167");
    expect(requestBody.focusQuestion).toBe("这局高地前到底哪里脱节了？");
    expect(requestBody.contextSummary).toContain("连续追问");
    expect(requestBody.contextSummary).toContain("先说结论");
    expect(requestBody.contextSummary).toContain("这局高地前到底哪里脱节了？");
  });

  it("does not keep deep-thinking mode on follow-up after the toggle is disabled", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      createFollowUpResponse("backend answer without deep thinking"),
    );
    const { container } = render(
      <ResultView
        request={{
          ...baseRequest,
          mode: "deep-thinking",
          deepThinking: true,
        }}
        conversation={matchConversation}
      />,
    );

    await user.click(
      container.querySelector(".analysis-chat-thinking-toggle") as HTMLButtonElement,
    );
    await user.type(screen.getByLabelText("继续追问"), "这波还要不要接？");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const firstRequest = fetchMock.mock.calls[0]?.[1];
    const requestBody =
      typeof firstRequest === "object" && firstRequest && "body" in firstRequest
        ? JSON.parse(String(firstRequest.body))
        : null;

    expect(requestBody.deepThinking).toBe(false);
    expect(requestBody.mode).toBe("ranked-coaching");
  });

  it("shows an actionable message when replay parsing fails because the parser is offline", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          job: {
            job_id: "job-parser-offline",
            match_id: "8724913167",
            status: "failed",
            detail: "Replay pipeline failed.",
            error:
              "Parser is not running. Start OpenDota parser on DOTA2_PARSER_URL or set DOTA2_AUTO_START_PARSER=true.",
          },
          matchSummary: null,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ) as unknown as Response,
    );

    render(
      <ResultView
        request={baseRequest}
        conversation={matchConversation}
        replayJob={{
          job_id: "job-parser-offline",
          match_id: "8724913167",
          status: "running",
          detail: "Replay download/parse pipeline is running.",
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("解析失败")).toBeInTheDocument();
    });

    expect(screen.getByText(/录像解析器服务未启动/u)).toBeInTheDocument();
    expect(screen.getByText(/DOTA2_AUTO_START_PARSER=true/u)).toBeInTheDocument();
    expect(screen.queryByText("录像解析失败，请稍后重试或检查后端服务。")).toBeNull();
  });
});
