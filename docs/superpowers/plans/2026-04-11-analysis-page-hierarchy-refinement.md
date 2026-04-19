# Analysis Page Hierarchy Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the analysis result page so it leads with a clear verdict, then short next actions, then evidence and deeper report details.

**Architecture:** Keep the existing `/analysis` route and result-loading flow unchanged. Refactor the page shell, result component structure, and shared styling so the hierarchy becomes verdict-first and the detailed report moves into lower-priority expandable surfaces.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4 via global CSS, Vitest, Testing Library

---

## File Structure

- Modify: `src/app/analysis/page.tsx`
  Responsibility: update the page-level framing and empty-state presentation.
- Modify: `src/components/workspace/result-view.tsx`
  Responsibility: rebuild the result hierarchy around verdict, actions, evidence, and expandable detail.
- Modify: `src/app/globals.css`
  Responsibility: add refined result-page styles aligned with the updated homepage language.
- Modify: `src/components/workspace/result-view.test.tsx`
  Responsibility: lock the verdict-first hierarchy in tests.
- Modify: `src/app/analysis/page.test.tsx`
  Responsibility: lock the route-level expectations for the updated result page.

### Task 1: Lock the new result hierarchy in tests

**Files:**
- Modify: `src/components/workspace/result-view.test.tsx`
- Modify: `src/app/analysis/page.test.tsx`

- [ ] Write failing assertions for the new verdict-first sections and removal of the old momentum panel.
- [ ] Run targeted result-page tests and confirm they fail against the current implementation.

### Task 2: Rebuild the result component structure

**Files:**
- Modify: `src/components/workspace/result-view.tsx`

- [ ] Keep all report content available from the existing schema.
- [ ] Make the one-line verdict the main hero content.
- [ ] Add a compact action layer driven by priority issues and practice plan.
- [ ] Replace the noisy summary/evidence arrangement with clearer chronological evidence cards and lower-priority detail sections.
- [ ] Keep prompt details accessible in a lower expandable area.

### Task 3: Refresh the result-page visual system

**Files:**
- Modify: `src/app/analysis/page.tsx`
- Modify: `src/app/globals.css`

- [ ] Align the page with the refined homepage’s premium light product style.
- [ ] Improve the empty state and page header hierarchy.
- [ ] Add result-page-specific surfaces and responsive layout rules without breaking the rest of the app.

### Task 4: Verify the refinement

**Files:**
- No code changes required unless verification finds issues

- [ ] Run the targeted result-page tests.
- [ ] Run the full test suite if targeted verification passes.
- [ ] Run lint and build before reporting completion.
