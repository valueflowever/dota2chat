import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("Home", () => {
  it("renders the chat workspace shell with a minimal new-chat entry", () => {
    const { container } = render(<Home />);

    expect(container.querySelector(".chat-app-shell")).not.toBeNull();
    expect(container.querySelector(".chat-history-sidebar")).not.toBeNull();
    expect(container.querySelector(".chat-stage-main")).not.toBeNull();
    expect(container.querySelector("#entry-input")).not.toBeNull();
    expect(container.querySelector(".chat-minimal-launch-form")).not.toBeNull();
    expect(container.querySelector(".icon-action-button-minimal")).not.toBeNull();
    expect(container.querySelector(".chat-empty-card")).toBeNull();
    expect(container.querySelector(".chat-entry-shell")).toBeNull();
    expect(container.querySelector(".chat-empty-suggestion-grid")).toBeNull();
    expect(container.querySelector(".chat-empty-settings-panel")).toBeNull();
  });
});
