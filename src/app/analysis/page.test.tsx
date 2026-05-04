import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import AnalysisPage from "@/app/analysis/page";

describe("AnalysisPage", () => {
  beforeEach(() => {
    globalThis.sessionStorage?.clear?.();
    globalThis.localStorage?.clear?.();
  });

  it("renders the same polished chat workspace on the compatibility route", () => {
    const { container } = render(<AnalysisPage />);

    expect(container.querySelector(".chat-history-sidebar")).not.toBeNull();
    expect(container.querySelector(".chat-history-new")).not.toBeNull();
    expect(container.querySelector(".chat-history-toggle")).not.toBeNull();
    expect(container.querySelector("#entry-input")).not.toBeNull();
    expect(container.querySelector(".chat-minimal-launch-form")).not.toBeNull();
  });
});
