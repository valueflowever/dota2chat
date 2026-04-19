# Audience-Driven Match Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the analysis page into a cleaner, audience-specific replay review surface with a prominent objective timeline, critical fight cards, and MVP/mistake summaries derived from the provided match data.

**Architecture:** Keep the current `/analysis` route and schema unchanged. Enrich the page by looking up demo match visualization data from a local registry keyed by `request.matchId`, then reorder and relabel sections based on `request.audience` so solo-player, coach, and creator see different priorities.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4 via global CSS, Vitest, Testing Library

---

## File Structure

- Modify: `src/components/workspace/result-view.tsx`
  Responsibility: render richer match visualizations and audience-specific layouts.
- Modify: `src/app/analysis/page.tsx`
  Responsibility: keep the page shell readable and aligned with the cleaner data-review layout.
- Modify: `src/app/globals.css`
  Responsibility: remove distracting gradient emphasis and style the new timeline/fight/MVP modules.
- Modify: `src/lib/analysis/demo-match-8724913167.ts`
  Responsibility: export richer match visualization seed data for this replay.
- Create or modify: `src/lib/analysis/demo-match-registry.ts`
  Responsibility: resolve visualization data by match id.
- Modify: `src/components/workspace/result-view.test.tsx`
- Modify: `src/app/analysis/page.test.tsx`

### Task 1: Lock the richer audience-specific UI contract in tests

**Files:**
- Modify: `src/components/workspace/result-view.test.tsx`
- Modify: `src/app/analysis/page.test.tsx`

- [ ] Assert that audience-specific pages render different main modules and labels.
- [ ] Assert that the enhanced page exposes an objective timeline as the main visualization.
- [ ] Assert that creator and coach views no longer read like the solo-player page.

### Task 2: Build demo match visualization data

**Files:**
- Modify: `src/lib/analysis/demo-match-8724913167.ts`
- Create or modify: `src/lib/analysis/demo-match-registry.ts`

- [ ] Export objective timeline entries, fight cards, and MVP/mistake summaries from the provided replay-derived seed.
- [ ] Add a lookup helper keyed by match id so the result page can opt into richer demo visuals without changing request schema.

### Task 3: Rebuild the result page around objective flow and audience focus

**Files:**
- Modify: `src/components/workspace/result-view.tsx`

- [ ] Keep the verdict-first hero.
- [ ] Promote objective timeline to a core visualization.
- [ ] Add critical fight cards and MVP/mistake summary cards.
- [ ] Reorder main sections by `request.audience`.
- [ ] Preserve the lower full-report section and prompt details.

### Task 4: Clean up the page shell and visual system

**Files:**
- Modify: `src/app/analysis/page.tsx`
- Modify: `src/app/globals.css`

- [ ] Reduce or remove distracting side gradients.
- [ ] Strengthen reading comfort with calmer surfaces and clearer section separation.
- [ ] Style the new visualization modules so they feel like a real replay review product rather than decorative cards.

### Task 5: Verify the refinement

**Files:**
- No code changes required unless verification finds issues

- [ ] Run targeted tests for result-view and analysis page.
- [ ] Run the full test suite.
- [ ] Run lint and build before reporting completion.
