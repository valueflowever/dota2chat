import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Manrope: () => ({
    variable: "font-space-grotesk",
  }),
  IBM_Plex_Mono: () => ({
    variable: "font-ibm-plex-mono",
  }),
}));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it('marks the html element for Next.js smooth-scroll handling', () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <div>content</div>
      </RootLayout>,
    );

    expect(markup).toContain('data-scroll-behavior="smooth"');
  });
});
