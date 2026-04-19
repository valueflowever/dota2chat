# Scheme C Style Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the live replay-analysis pages with scheme C's cooler cyber interface language while keeping the existing product-first layout and removing literal Dota/HUD presentation from production copy.

**Architecture:** Keep the current page and component structure intact, and concentrate the redesign in shared global tokens plus targeted class updates inside the homepage, workspace, and result renderer. Use tests only where visible production copy or stable structure changes, and avoid brittle CSS-only assertions.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4 via global CSS utilities, Vitest, Testing Library

---

## File Structure

- Modify: `src/app/globals.css`
  Responsibility: replace the current warm fantasy tokens and component utility classes with the cooler scheme C-inspired surface system.
- Modify: `src/app/page.tsx`
  Responsibility: simplify the hero into a minimal product-first shell that matches the new visual language and removes literal Dota-specific wording.
- Modify: `src/components/workspace/analysis-workspace.tsx`
  Responsibility: keep workflow and fields intact while updating production copy and class hooks that currently lean on war-room / Dota framing.
- Modify: `src/components/workspace/result-view.tsx`
  Responsibility: preserve report structure but remove battle-report language and reframe the results as a cyber analysis console.
- Modify if needed: `src/app/page.test.tsx`, `src/components/workspace/analysis-workspace.test.tsx`, `src/app/analysis/page.test.tsx`, `src/components/workspace/result-view.test.tsx`
  Responsibility: lock in any production copy that intentionally changes and keep tests aligned with stable semantics.

### Task 1: Lock The New Production Tone With Tests

**Files:**
- Modify: `src/app/page.test.tsx`
- Modify: `src/components/workspace/analysis-workspace.test.tsx`
- Modify: `src/components/workspace/result-view.test.tsx`

- [ ] **Step 1: Write the failing test assertions**

```tsx
expect(screen.queryByText(/Ancient Lens/i)).not.toBeInTheDocument();
expect(screen.queryByText(/Roshan|Smoke Route|High Ground Ward/i)).not.toBeInTheDocument();
expect(screen.queryByText(/Battle Report|War Room/i)).not.toBeInTheDocument();
expect(screen.getByRole("button", { name: /开始分析/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/app/page.test.tsx src/components/workspace/analysis-workspace.test.tsx src/components/workspace/result-view.test.tsx`

Expected: FAIL because the current production pages still render `Ancient Lens`, `Roshan`, `War Room`, and `Battle Report` phrasing.

- [ ] **Step 3: Keep the expectations focused on stable copy**

```tsx
expect(screen.getByRole("heading", { name: /把一局比赛拆成真正能改的节点/i })).toBeInTheDocument();
expect(screen.getByRole("button", { name: /加载示例/i })).toBeInTheDocument();
expect(screen.getByRole("button", { name: /开始分析/i })).toBeInTheDocument();
```

- [ ] **Step 4: Re-run the same tests after implementation**

Run: `npm test -- src/app/page.test.tsx src/components/workspace/analysis-workspace.test.tsx src/components/workspace/result-view.test.tsx`

Expected: PASS

### Task 2: Re-Skin The Shared Production Surface System

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace warm-theme tokens with scheme C-inspired tokens**

```css
:root {
  --background: #06101a;
  --background-soft: #0b1622;
  --foreground: #eff5ff;
  --muted: #96a8bd;
  --card: linear-gradient(180deg, rgba(12, 20, 32, 0.92), rgba(7, 12, 20, 0.96));
  --line: rgba(126, 169, 212, 0.18);
  --line-strong: rgba(137, 191, 238, 0.3);
  --color-accent: #5eb5ff;
  --color-accent-soft: rgba(94, 181, 255, 0.14);
  --color-success: #68b57a;
  --color-danger: #d56b63;
  --shadow-soft: 0 24px 60px rgba(0, 0, 0, 0.35);
  --shadow-glow: 0 0 0 1px rgba(94, 181, 255, 0.14), 0 18px 40px rgba(42, 96, 148, 0.16);
}
```

- [ ] **Step 2: Rework shared utility classes instead of creating a new page-specific layout**

```css
.surface-card {
  border: 1px solid var(--line);
  border-radius: 26px;
  background: var(--card);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(16px);
}

.field-input:focus {
  border-color: var(--line-strong);
  box-shadow: 0 0 0 4px rgba(94, 181, 255, 0.12);
}

.primary-cta {
  background: linear-gradient(180deg, #7ec7ff 0%, #2b6eb0 100%);
}
```

- [ ] **Step 3: Remove production-only classes that encode the old war-room identity**

```css
.war-room-banner,
.war-room-badge,
.hero-relic,
.report-banner,
.report-kicker {
  /* replace with neutral console/panel classes or remove if unused */
}
```

- [ ] **Step 4: Verify CSS changes through the targeted tests**

Run: `npm test -- src/app/page.test.tsx src/components/workspace/analysis-workspace.test.tsx src/components/workspace/result-view.test.tsx`

Expected: PASS or FAIL only for intentional copy work still pending

### Task 3: Update The Homepage And Workspace Copy Without Changing Workflow

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/workspace/analysis-workspace.tsx`

- [ ] **Step 1: Simplify homepage hero copy**

```tsx
<section className="hero-shell">
  <div className="hero-copy">
    <p className="eyebrow">Replay Analysis Workspace</p>
    <h1 className="hero-title">
      把一局比赛
      <br />
      拆成真正能改的节点
    </h1>
    <p className="hero-subtitle">
      输入问题，补充上下文，直接得到清晰、可执行的复盘建议。
    </p>
  </div>
</section>
```

- [ ] **Step 2: Remove literal Dota/HUD flavor from production workspace framing**

```tsx
<section className="surface-card workspace-panel p-5 sm:p-6">
  <div className="space-y-5">
    <div className="workspace-banner">
      <span className="workspace-badge">Structured Input</span>
      <span className="workspace-badge workspace-badge-muted">Faster useful output</span>
    </div>
```

- [ ] **Step 3: Normalize CTA and helper copy**

```tsx
{isSubmitting ? "正在分析..." : "开始分析"}
```

```tsx
<p className="max-w-2xl text-sm leading-7 text-slate-300">
  先写下最想复盘的问题，再按需补充时间点、阵容、语音片段或补充笔记。
</p>
```

- [ ] **Step 4: Re-run the page and workspace tests**

Run: `npm test -- src/app/page.test.tsx src/components/workspace/analysis-workspace.test.tsx`

Expected: PASS

### Task 4: Reframe The Result View As An Analysis Console

**Files:**
- Modify: `src/components/workspace/result-view.tsx`
- Modify if needed: `src/app/analysis/page.tsx`

- [ ] **Step 1: Replace battle-report framing with neutral console language**

```tsx
<p className="eyebrow">Analysis Output</p>
<span className="report-chip">
  {report.source === "live-ai" ? "OpenAI 实时分析" : "本地演示模式"}
</span>
<h3 className="text-2xl font-semibold tracking-tight text-stone-50">
  结果总览
</h3>
```

- [ ] **Step 2: Remove decorative kickers that feel like fantasy copy**

```tsx
{/* delete the old report-kicker block and keep the headline + overview area tighter */}
```

- [ ] **Step 3: Keep reading order but re-label sections more product-neutrally**

```tsx
<p className="eyebrow">Priority Focus</p>
<h3 className="text-2xl font-semibold tracking-tight text-stone-50">
  优先处理事项
</h3>
```

```tsx
<p className="eyebrow">Detailed Breakdown</p>
<h3 className="text-2xl font-semibold tracking-tight text-stone-50">
  分段分析
</h3>
```

- [ ] **Step 4: Re-run the result tests**

Run: `npm test -- src/components/workspace/result-view.test.tsx src/app/analysis/page.test.tsx`

Expected: PASS

### Task 5: Full Verification

**Files:**
- No file changes expected

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: all tests pass

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: no ESLint errors

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: Next.js build succeeds without type errors

- [ ] **Step 4: Manual sanity check**

Review:
- homepage still lets users start immediately
- workspace fields remain in the same order
- result page still reads clearly on dense content
- production UI no longer shows the previous war-room / battle-report branding
