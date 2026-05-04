import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import StyleLabPage from "@/app/style-lab/page";

describe("StyleLabPage", () => {
  it("shows a temporary side-by-side comparison between Linear and Notion directions", () => {
    render(<StyleLabPage />);

    expect(screen.getByText("Ancient Lens Style Lab")).toBeInTheDocument();
    expect(screen.getByText("Linear 风 vs Notion 风")).toBeInTheDocument();
    expect(screen.getByText("Direction A / Linear")).toBeInTheDocument();
    expect(screen.getByText("Direction B / Notion")).toBeInTheDocument();
    expect(screen.getByText("更硬的产品感")).toBeInTheDocument();
    expect(screen.getByText("更柔和的文档感")).toBeInTheDocument();
    expect(screen.getByText("选择 Linear 风")).toBeInTheDocument();
    expect(screen.getByText("选择 Notion 风")).toBeInTheDocument();
    expect(screen.getAllByText("Ancient Lens")).toHaveLength(2);
    expect(screen.getAllByText("继续追问")).toHaveLength(2);
    expect(screen.getAllByText("这局为什么会输？")).toHaveLength(2);
    expect(screen.getAllByText("比赛编号 8123456789")).toHaveLength(2);
  });
});
