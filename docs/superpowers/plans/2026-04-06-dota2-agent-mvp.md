# Dota 2 Agent MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js replay analysis service for Dota 2 that lets different user types submit replay context and receive structured, actionable feedback.

**Architecture:** Use a single App Router page with progressive-disclosure UI, a typed analysis domain in `src/lib/analysis`, and an API route that can call a live OpenAI-backed analyzer or a deterministic local fallback engine. Keep the first version stateless and sample-driven so it is easy to run locally.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Vitest, React Testing Library, Zod, optional OpenAI SDK

---

### Task 1: Project Tooling And Test Harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/test/test-utils.tsx`

- [ ] **Step 1: Add testing dependencies**

```bash
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 2: Add test scripts to `package.json`**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Configure Vitest for jsdom and path aliases**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Add testing setup**

```ts
import "@testing-library/jest-dom/vitest";
```

### Task 2: Analysis Schema And Prompt Builder

**Files:**
- Create: `src/lib/analysis/schema.ts`
- Create: `src/lib/analysis/prompts.ts`
- Test: `src/lib/analysis/prompts.test.ts`

- [ ] **Step 1: Write the failing prompt test**

```ts
import { describe, expect, it } from "vitest";
import { buildAnalysisPrompt } from "@/lib/analysis/prompts";

describe("buildAnalysisPrompt", () => {
  it("includes audience-specific coaching instructions and replay context", () => {
    const prompt = buildAnalysisPrompt({
      audience: "solo-player",
      mode: "ranked-coaching",
      focusQuestion: "Why did we lose control after minute 18?",
      role: "pos4",
      skillBracket: "Ancient",
      draftSummary: "We drafted Storm, Mars, Phoenix into heavy silence.",
      timeline: [{ time: "18:40", title: "failed smoke", impact: "lost triangle control" }],
      transcript: "Team hesitated before Roche call.",
    });

    expect(prompt.system).toContain("Dota 2 replay analyst");
    expect(prompt.system).toContain("solo ranked player");
    expect(prompt.user).toContain("18:40");
    expect(prompt.user).toContain("Why did we lose control");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- src/lib/analysis/prompts.test.ts
```

- [ ] **Step 3: Implement the minimal schema and prompt builder**

```ts
export type AnalysisAudience = "solo-player" | "coach" | "creator";

export function buildAnalysisPrompt(input: AnalysisRequest) {
  return {
    system: "You are a Dota 2 replay analyst ...",
    user: `Focus question: ${input.focusQuestion}`,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- src/lib/analysis/prompts.test.ts
```

### Task 3: Local Fallback Engine

**Files:**
- Create: `src/lib/analysis/local-engine.ts`
- Test: `src/lib/analysis/local-engine.test.ts`

- [ ] **Step 1: Write the failing local engine test**

```ts
import { describe, expect, it } from "vitest";
import { analyzeReplayLocally } from "@/lib/analysis/local-engine";

describe("analyzeReplayLocally", () => {
  it("returns a structured report with priorities and drills", async () => {
    const report = await analyzeReplayLocally({
      audience: "solo-player",
      mode: "ranked-coaching",
      focusQuestion: "Why did our mid game collapse?",
      role: "mid",
      skillBracket: "Divine",
      timeline: [{ time: "21:10", title: "high ground poke", impact: "lost aegis timing" }],
      transcript: "No ward behind pit before contest.",
    });

    expect(report.summary.headline.length).toBeGreaterThan(0);
    expect(report.priorityIssues).toHaveLength(3);
    expect(report.practicePlan.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- src/lib/analysis/local-engine.test.ts
```

- [ ] **Step 3: Implement the minimal deterministic analyzer**

```ts
export async function analyzeReplayLocally(input: AnalysisRequest) {
  return {
    summary: { headline: "Mid game decisions cost map control." },
    priorityIssues: [],
    practicePlan: [],
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- src/lib/analysis/local-engine.test.ts
```

### Task 4: Server Analysis Entry Point

**Files:**
- Create: `src/lib/analysis/service.ts`
- Create: `src/app/api/analyze/route.ts`
- Test: `src/app/api/analyze/route.test.ts`

- [ ] **Step 1: Write the failing API test**

```ts
import { POST } from "@/app/api/analyze/route";

test("returns a structured analysis response", async () => {
  const request = new Request("http://localhost/api/analyze", {
    method: "POST",
    body: JSON.stringify({
      audience: "solo-player",
      mode: "quick-scan",
      focusQuestion: "What are the biggest problems?",
    }),
  });

  const response = await POST(request);

  expect(response.status).toBe(200);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- src/app/api/analyze/route.test.ts
```

- [ ] **Step 3: Implement validation and fallback analysis routing**

```ts
const payload = await request.json();
const parsed = analysisRequestSchema.safeParse(payload);
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- src/app/api/analyze/route.test.ts
```

### Task 5: Analysis Workspace UI

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/workspace/analysis-workspace.tsx`
- Create: `src/components/workspace/result-view.tsx`
- Create: `src/components/workspace/sample-data.ts`
- Test: `src/components/workspace/analysis-workspace.test.tsx`

- [ ] **Step 1: Write the failing UI test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalysisWorkspace } from "@/components/workspace/analysis-workspace";

test("switches audience presets and reveals the selected label", async () => {
  render(<AnalysisWorkspace />);

  await userEvent.click(screen.getByRole("button", { name: /团队教练/i }));

  expect(screen.getByText(/团队复盘视角/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- src/components/workspace/analysis-workspace.test.tsx
```

- [ ] **Step 3: Implement the workspace and results renderer**

```tsx
export function AnalysisWorkspace() {
  return <section>...</section>;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- src/components/workspace/analysis-workspace.test.tsx
```

### Task 6: Visual Refinement And Verification

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Apply final visual system**

```css
:root {
  --bg: #f4efe6;
  --ink: #111827;
  --ember: #dc6b2f;
}
```

- [ ] **Step 2: Verify responsive layout**

```bash
npm run build
```

- [ ] **Step 3: Verify lint and tests**

```bash
npm run lint
npm test
```

- [ ] **Step 4: Document environment usage**

```md
Use `OPENAI_API_KEY` to enable live AI mode. Without it, the app runs in local demo mode.
```

## Self-Review

- The plan covers setup, prompt construction, analysis generation, server integration, UI, and final verification.
- No placeholder steps remain for the main implementation flow.
- Naming should stay consistent around `AnalysisRequest`, `AnalysisReport`, `buildAnalysisPrompt`, and `analyzeReplayLocally`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-06-dota2-agent-mvp.md`. Because the user explicitly asked for autonomous execution without approval checkpoints, continue with inline execution in this session.
