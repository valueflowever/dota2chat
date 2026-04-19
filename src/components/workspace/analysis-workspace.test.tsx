import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnalysisWorkspace } from "@/components/workspace/analysis-workspace";
import { renderWithProviders } from "@/test/test-utils";

function createConversationResponse(matchId: string, verdict: string) {
  return new Response(
    JSON.stringify({
      conversation: {
        mode: "match-replay",
        title: `match ${matchId}`,
        summary: "first pass",
        source: "demo-engine",
        generatedAt: "2026-04-06T00:00:00.000Z",
        messages: [
          {
            id: "user-entry",
            role: "user",
            content: matchId,
          },
          {
            id: "assistant-entry",
            role: "assistant",
            content: verdict,
          },
        ],
        followUps: [
          {
            question: "why did this game collapse",
            answer: "objective setup was incomplete",
          },
          {
            question: "what should change next game",
            answer: "stabilize the three-step setup call",
          },
        ],
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

describe("AnalysisWorkspace", () => {
  beforeEach(() => {
    globalThis.sessionStorage?.clear?.();
    globalThis.localStorage?.clear?.();
    vi.restoreAllMocks();
  });

  it("hydrates without the getServerSnapshot infinite loop warning", async () => {
    const savedGlobals = {
      window: globalThis.window,
      document: globalThis.document,
      navigator: globalThis.navigator,
      sessionStorage: globalThis.sessionStorage,
      localStorage: globalThis.localStorage,
    };

    try {
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(globalThis, "document", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(globalThis, "navigator", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(globalThis, "sessionStorage", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(globalThis, "localStorage", {
        value: undefined,
        configurable: true,
      });

      const serverMarkup = renderToString(<AnalysisWorkspace />);

      expect(serverMarkup).toContain("chat-stage-loading");

      Object.defineProperty(globalThis, "window", {
        value: savedGlobals.window,
        configurable: true,
      });
      Object.defineProperty(globalThis, "document", {
        value: savedGlobals.document,
        configurable: true,
      });
      Object.defineProperty(globalThis, "navigator", {
        value: savedGlobals.navigator,
        configurable: true,
      });
      Object.defineProperty(globalThis, "sessionStorage", {
        value: savedGlobals.sessionStorage,
        configurable: true,
      });
      Object.defineProperty(globalThis, "localStorage", {
        value: savedGlobals.localStorage,
        configurable: true,
      });

      const container = document.createElement("div");
      container.innerHTML = serverMarkup;
      document.body.appendChild(container);

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const root = hydrateRoot(container, <AnalysisWorkspace />);

      await waitFor(() => {
        expect(container.querySelector("#entry-input")).not.toBeNull();
      });

      expect(
        consoleErrorSpy.mock.calls.some((call) =>
          call.some(
            (value) =>
              typeof value === "string" &&
              value.includes("getServerSnapshot should be cached"),
          ),
        ),
      ).toBe(false);

      root.unmount();
      container.remove();
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: savedGlobals.window,
        configurable: true,
      });
      Object.defineProperty(globalThis, "document", {
        value: savedGlobals.document,
        configurable: true,
      });
      Object.defineProperty(globalThis, "navigator", {
        value: savedGlobals.navigator,
        configurable: true,
      });
      Object.defineProperty(globalThis, "sessionStorage", {
        value: savedGlobals.sessionStorage,
        configurable: true,
      });
      Object.defineProperty(globalThis, "localStorage", {
        value: savedGlobals.localStorage,
        configurable: true,
      });
    }
  });

  it("shows the polished chat workspace with a minimal launch stage", () => {
    const { container } = renderWithProviders(<AnalysisWorkspace />);

    expect(container.querySelector(".chat-empty-stage")).not.toBeNull();
    expect(container.querySelector(".chat-minimal-launch-form")).not.toBeNull();
    expect(container.querySelector(".icon-action-button-minimal")).not.toBeNull();
    expect(container.querySelector(".chat-empty-card")).toBeNull();
    expect(container.querySelector(".chat-entry-shell")).toBeNull();
    expect(container.querySelector(".chat-empty-suggestion-grid")).toBeNull();
    expect(container.querySelector(".chat-empty-settings-panel")).toBeNull();
    expect(container.querySelector(".chat-history-action-stack")).not.toBeNull();
    expect(container.querySelector(".chat-history-list-panel")).not.toBeNull();
    expect(container.querySelector("#replay-loader-input")).not.toBeNull();
    expect(container.querySelector("#entry-input")).not.toBeNull();
  });

  it("collapses the fixed sidebar without affecting the main workspace", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<AnalysisWorkspace />);
    const collapseButton = container.querySelector(
      ".chat-history-toggle",
    ) as HTMLButtonElement;

    await user.click(collapseButton);

    expect(container.querySelector(".chat-app-shell-collapsed")).not.toBeNull();
    expect(container.querySelector(".chat-history-collapsed-hint")).not.toBeNull();
    expect(container.querySelector("#entry-input")).not.toBeNull();
  });

  it("keeps the empty-state settings launcher and opens the minimal settings panel on demand", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<AnalysisWorkspace />);

    expect(container.querySelector(".icon-action-button-minimal")).not.toBeNull();
    expect(container.querySelector(".chat-empty-settings-panel")).toBeNull();

    await user.click(
      container.querySelector(".icon-action-button-minimal") as HTMLButtonElement,
    );

    expect(container.querySelector(".chat-empty-settings-panel")).not.toBeNull();
    expect(container.querySelector(".form-input-home-minimal")).not.toBeNull();
  });

  it("allows typing into the empty-state settings textarea", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<AnalysisWorkspace />);

    await user.click(
      container.querySelector(".icon-action-button-minimal") as HTMLButtonElement,
    );

    const textarea = container.querySelector(
      ".chat-empty-settings-panel textarea",
    ) as HTMLTextAreaElement | null;

    expect(textarea).not.toBeNull();

    await user.type(textarea as HTMLTextAreaElement, "Roshan");

    expect((textarea as HTMLTextAreaElement).value).toContain("Roshan");
  });

  it("loads a replay id from the sidebar and records it in history", async () => {
    const user = userEvent.setup();
    vi.spyOn(global, "fetch").mockResolvedValue(
      createConversationResponse(
        "8123456789",
        "tempo broke around the Roshan setup",
      ),
    );

    const { container } = renderWithProviders(<AnalysisWorkspace />);
    const replayInput = container.querySelector(
      "#replay-loader-input",
    ) as HTMLInputElement;
    const replaySubmit = container.querySelector(
      ".chat-history-loader-button",
    ) as HTMLButtonElement;

    await user.type(replayInput, "8123456789");
    await user.click(replaySubmit);

    await waitFor(() => {
      expect(
        within(screen.getByRole("main")).getByText(
          "tempo broke around the Roshan setup",
        ),
      ).toBeInTheDocument();
    });

    expect(container.querySelectorAll(".chat-history-item").length).toBeGreaterThan(0);
    expect(localStorage.getItem("ancient-lens-analysis-history")).toContain("8123456789");
  });

  it("keeps history and clears the active conversation when starting a new chat", async () => {
    const user = userEvent.setup();
    vi.spyOn(global, "fetch").mockResolvedValue(
      createConversationResponse("8123456789", "the tempo snapped first"),
    );

    const { container } = renderWithProviders(<AnalysisWorkspace />);
    const replayInput = container.querySelector(
      "#replay-loader-input",
    ) as HTMLInputElement;
    const replaySubmit = container.querySelector(
      ".chat-history-loader-button",
    ) as HTMLButtonElement;
    const newChatButton = container.querySelector(".chat-history-new") as HTMLButtonElement;

    await user.type(replayInput, "8123456789");
    await user.click(replaySubmit);

    await waitFor(() => {
      expect(
        within(screen.getByRole("main")).getByText("the tempo snapped first"),
      ).toBeInTheDocument();
    });

    await user.click(newChatButton);

    expect(container.querySelector("#entry-input")).not.toBeNull();
    expect(container.querySelectorAll(".chat-history-item").length).toBeGreaterThan(0);
    expect(within(screen.getByRole("main")).queryByText("the tempo snapped first")).toBeNull();
  });

  it("switches the active conversation when a history item is selected", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(global, "fetch");

    fetchMock
      .mockResolvedValueOnce(
        createConversationResponse("8123456789", "first match verdict"),
      )
      .mockResolvedValueOnce(
        createConversationResponse("9988776655", "second match verdict"),
      );

    const { container } = renderWithProviders(<AnalysisWorkspace />);
    const replayInput = container.querySelector(
      "#replay-loader-input",
    ) as HTMLInputElement;
    const replaySubmit = container.querySelector(
      ".chat-history-loader-button",
    ) as HTMLButtonElement;
    const newChatButton = container.querySelector(".chat-history-new") as HTMLButtonElement;

    await user.type(replayInput, "8123456789");
    await user.click(replaySubmit);

    await waitFor(() => {
      expect(
        within(screen.getByRole("main")).getByText("first match verdict"),
      ).toBeInTheDocument();
    });

    await user.click(newChatButton);
    await user.clear(replayInput);
    await user.type(replayInput, "9988776655");
    await user.click(replaySubmit);

    await waitFor(() => {
      expect(
        within(screen.getByRole("main")).getByText("second match verdict"),
      ).toBeInTheDocument();
    });

    const historyItems = container.querySelectorAll(".chat-history-item");
    await user.click(historyItems[1] as HTMLButtonElement);

    expect(
      within(screen.getByRole("main")).getByText("first match verdict"),
    ).toBeInTheDocument();
  });
});
