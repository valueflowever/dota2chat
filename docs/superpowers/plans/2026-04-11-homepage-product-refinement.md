# Homepage Product Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the homepage intake experience into a cleaner product-style layout and shorten the advanced panel without breaking analysis behavior.

**Architecture:** Keep the existing single workspace component and session-backed request flow. Limit the change to homepage presentation, advanced-field prioritization, and the corresponding tests so the API contract and analysis route remain untouched.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4 via global CSS, Vitest, Testing Library

---

## File Structure

- Modify: `src/components/workspace/analysis-workspace.tsx`
  Responsibility: simplify the advanced section, adjust homepage structure, and preserve request behavior.
- Modify: `src/app/globals.css`
  Responsibility: introduce the refined homepage visual system and compact advanced panel styling.
- Modify: `src/app/page.test.tsx`
  Responsibility: lock the new homepage hero expectations.
- Modify: `src/components/workspace/analysis-workspace.test.tsx`
  Responsibility: lock the shorter advanced panel contract and preserve behavior tests.

### Task 1: Lock the new homepage contract in tests

**Files:**
- Modify: `src/app/page.test.tsx`
- Modify: `src/components/workspace/analysis-workspace.test.tsx`

- [ ] Write failing assertions for the new hero copy, capability chips, and reduced advanced fields.
- [ ] Run the targeted workspace tests and verify they fail against the current UI.

### Task 2: Rebuild the workspace structure

**Files:**
- Modify: `src/components/workspace/analysis-workspace.tsx`

- [ ] Keep submit, draft persistence, sample loading, and timeline logic unchanged.
- [ ] Replace the sparse homepage heading with a richer hero shell.
- [ ] Reduce the advanced area to audience, mode, focus question, tone, sample load, and timeline controls.
- [ ] Remove the lower-frequency metadata fields from the homepage advanced section.

### Task 3: Refresh the shared homepage styling

**Files:**
- Modify: `src/app/globals.css`

- [ ] Replace the heavy white-page search treatment with a premium soft-background hero and elevated search card.
- [ ] Add shorter advanced section styling that supports the reduced field set.
- [ ] Preserve responsive behavior and existing component class hooks used elsewhere.

### Task 4: Verify the refinement

**Files:**
- No code changes required unless verification finds issues

- [ ] Run the targeted homepage/workspace tests.
- [ ] Run the full test suite if targeted verification passes.
- [ ] Run lint and build before reporting completion.
