# Match Intelligence Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the intake page and analysis page into a dark, product-grade Dota 2 match intelligence workflow while preserving the existing analysis request and result flow.

**Architecture:** Keep the current two-route flow (`/` intake, `/analysis` results) and the existing API/session storage behavior. Replace the current light UI with a dark dashboard language, add a search-led intake experience, and map the existing analysis response into a dashboard summary plus a detailed AI report section.

**Tech Stack:** Next.js App Router, React client components, Tailwind CSS v4 utilities plus global CSS, Vitest, Testing Library

---

### Task 1: Lock the new UI contract with tests

**Files:**
- Modify: `src/app/page.test.tsx`
- Modify: `src/components/workspace/analysis-workspace.test.tsx`
- Modify: `src/app/analysis/page.test.tsx`
- Modify: `src/components/workspace/result-view.test.tsx`

- [ ] Rewrite the page-level tests to assert the new intake/search experience and dashboard-first analysis layout.
- [ ] Run the targeted Vitest commands and confirm the updated assertions fail against the old UI.

### Task 2: Rebuild the intake page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/workspace/analysis-workspace.tsx`
- Modify: `src/components/workspace/sample-data.ts`

- [ ] Keep the existing submit/session logic, but redesign the UI around a search-bar-first intake screen.
- [ ] Preserve audience selection, sample loading, advanced fields, and loading/error states.
- [ ] Add a safe fallback focus question so the search-led flow can still submit without forcing the advanced panel open.

### Task 3: Rebuild the analysis dashboard

**Files:**
- Modify: `src/app/analysis/page.tsx`
- Modify: `src/components/workspace/result-view.tsx`

- [ ] Replace the plain report layout with a dashboard header, hero summary, KPI cards, timeline panel, key-event stream, matrix/table section, stacked side panels, and a lower detailed AI report section.
- [ ] Derive all dashboard content from the existing request/report/warning data instead of inventing unsupported match telemetry.
- [ ] Keep the current empty-state behavior for missing stored analysis results.

### Task 4: Refresh the shared visual system

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] Introduce the dark visual system, shared surfaces, typography rhythm, and form/button treatments needed by both pages.
- [ ] Preserve the existing font setup and Next.js scroll behavior handling.

### Task 5: Verify the redesign

**Files:**
- No code changes required unless verification finds issues

- [ ] Run the targeted tests for the redesigned components.
- [ ] Run the full test suite, lint, and build.
- [ ] Fix any regressions before reporting completion.
