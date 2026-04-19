# Plain UI Rollback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revert the production UI to a simple, clean product interface while preserving all previously fixed functionality.

**Architecture:** Keep the existing page/component structure and all interaction logic intact. Limit the rollback to copy, shared visual tokens, and presentation classes in the homepage, workspace, and result view so the app feels plain and readable again.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4 via global CSS, Vitest, Testing Library

---

## File Structure

- Modify: `src/app/globals.css`
  Responsibility: replace the current cyber styling with a plain, neutral visual system.
- Modify: `src/app/page.tsx`
  Responsibility: simplify the hero to a minimal heading/subtitle shell.
- Modify: `src/components/workspace/analysis-workspace.tsx`
  Responsibility: remove decorative badges and specialized framing while preserving all form behavior.
- Modify: `src/components/workspace/result-view.tsx`
  Responsibility: present the report as a plain result page instead of a themed console.
- Modify: `src/app/page.test.tsx`
- Modify: `src/components/workspace/result-view.test.tsx`
- Modify if needed: `src/app/analysis/page.test.tsx`

### Task 1: Lock The Plain UI Expectations In Tests

**Files:**
- Modify: `src/app/page.test.tsx`
- Modify: `src/components/workspace/result-view.test.tsx`
- Modify if needed: `src/app/analysis/page.test.tsx`

- [ ] **Step 1: Write failing assertions for removal of themed UI labels**

```tsx
expect(screen.queryByText("结构化输入")).not.toBeInTheDocument();
expect(screen.queryByText("Focused Review Input")).not.toBeInTheDocument();
expect(screen.queryByText("Analysis Output")).not.toBeInTheDocument();
expect(screen.getByText("分析结果")).toBeInTheDocument();
```

- [ ] **Step 2: Run targeted tests to verify they fail**

Run: `npm test -- src/app/page.test.tsx src/components/workspace/result-view.test.tsx src/app/analysis/page.test.tsx`

Expected: FAIL because the current UI still renders the themed labels.

- [ ] **Step 3: Keep stable assertions for main actions**

```tsx
expect(screen.getByRole("button", { name: "加载示例" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "开始分析" })).toBeInTheDocument();
expect(screen.getByRole("link", { name: "返回修改" })).toBeInTheDocument();
```

- [ ] **Step 4: Re-run the same tests after implementation**

Run: `npm test -- src/app/page.test.tsx src/components/workspace/result-view.test.tsx src/app/analysis/page.test.tsx`

Expected: PASS

### Task 2: Replace The Shared Visual System With A Plain Product Style

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace the dark cyber tokens with plain neutral tokens**

```css
:root {
  --background: #f6f7fb;
  --foreground: #111827;
  --muted: #6b7280;
  --card: #ffffff;
  --line: #e5e7eb;
  --line-strong: #cbd5e1;
  --color-accent: #2563eb;
  --shadow-soft: 0 12px 30px rgba(15, 23, 42, 0.06);
}
```

- [ ] **Step 2: Remove decorative overlays and heavy gradients**

```css
body {
  background: #f6f7fb;
}

body::before,
body::after {
  display: none;
}
```

- [ ] **Step 3: Simplify shared component classes**

```css
.surface-card {
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--card);
  box-shadow: var(--shadow-soft);
}
```

- [ ] **Step 4: Verify the tests still target semantics, not styling internals**

Run: `npm test -- src/app/page.test.tsx src/components/workspace/result-view.test.tsx src/app/analysis/page.test.tsx`

Expected: PASS or only copy-related failures remain

### Task 3: Simplify The Homepage And Workspace Framing

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/workspace/analysis-workspace.tsx`

- [ ] **Step 1: Reduce the homepage to a plain heading block**

```tsx
<section className="hero-shell">
  <div className="hero-copy">
    <h1 className="hero-title">Dota 2 录像复盘助手</h1>
    <p className="hero-subtitle">
      输入问题和上下文，快速得到结构化的复盘建议。
    </p>
  </div>
</section>
```

- [ ] **Step 2: Remove workspace badges and extra themed eyebrow copy**

```tsx
<section className="surface-card workspace-panel p-5 sm:p-6">
  <div className="space-y-5">
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold text-slate-900">开始复盘</h2>
      <p className="text-sm leading-7 text-slate-600">
        先写下最想分析的问题，再按需补充更多信息。
      </p>
    </div>
```

- [ ] **Step 3: Keep all existing controls and button labels unchanged**

```tsx
{isSubmitting ? "正在分析..." : "开始分析"}
```

- [ ] **Step 4: Run the homepage and workspace tests**

Run: `npm test -- src/app/page.test.tsx src/components/workspace/analysis-workspace.test.tsx`

Expected: PASS

### Task 4: Present Results As A Plain Report Page

**Files:**
- Modify: `src/components/workspace/result-view.tsx`
- Modify if needed: `src/app/analysis/page.tsx`

- [ ] **Step 1: Replace console-themed section framing with plain headings**

```tsx
<section className="surface-card p-6 sm:p-7">
  <p className="text-sm font-medium text-slate-500">分析结果</p>
  <h2 className="mt-3 text-3xl font-semibold text-slate-900">
    {report.summary.headline}
  </h2>
```

- [ ] **Step 2: Rename section labels to simple report language**

```tsx
<h3 className="text-2xl font-semibold text-slate-900">结果总览</h3>
<h3 className="text-2xl font-semibold text-slate-900">优先问题</h3>
<h3 className="text-2xl font-semibold text-slate-900">详细分析</h3>
```

- [ ] **Step 3: Keep the report content and expand/collapse structure intact**

```tsx
{/* No schema or logic changes; only visual framing and labels change */}
```

- [ ] **Step 4: Run result-page tests**

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

Expected: build succeeds without type errors
