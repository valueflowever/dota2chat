# Homepage And Analysis Professional Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the homepage into a higher-conversion analysis launch surface and the analysis page into a more professional replay briefing without changing routes, schema, or storage behavior.

**Architecture:** Keep the current two-route flow and existing client-session behavior. Rework the homepage mostly inside `AnalysisWorkspace` and shared global CSS, then refine the analysis page shell and `ResultView` hierarchy so verdict, actions, and evidence feel more like a coherent replay report. Preserve audience-specific module ordering and existing demo visualization helpers.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4 global CSS, Vitest, Testing Library

---

## File Structure

- Modify: `src/app/page.tsx`
  Responsibility: keep the homepage shell aligned with the upgraded product-entry framing.
- Modify: `src/components/workspace/analysis-workspace.tsx`
  Responsibility: rebuild the homepage hero, launch card, advanced panel framing, and homepage trust strip while preserving submit logic.
- Modify: `src/app/analysis/page.tsx`
  Responsibility: strengthen the top-level report shell, empty state, and report-page framing.
- Modify: `src/components/workspace/result-view.tsx`
  Responsibility: refine verdict/action/evidence hierarchy and make the report read more like a professional briefing.
- Modify: `src/app/globals.css`
  Responsibility: implement the shared visual system updates for the homepage and analysis page.
- Modify: `src/app/page.test.tsx`
- Modify: `src/components/workspace/analysis-workspace.test.tsx`
- Modify: `src/app/analysis/page.test.tsx`
- Modify: `src/components/workspace/result-view.test.tsx`

### Task 1: Lock the refined homepage contract in tests

**Files:**
- Modify: `src/app/page.test.tsx`
- Modify: `src/components/workspace/analysis-workspace.test.tsx`

- [ ] Assert that the homepage now exposes a value-led hero and a stronger analysis launch surface.
- [ ] Assert that the launch surface still keeps the match ID input as the only default visible control.
- [ ] Assert that advanced controls still toggle open, preserve sample loading, and continue to submit successfully.
- [ ] Run the homepage-focused tests first and confirm they fail against the current UI before implementation.

### Task 2: Implement the homepage conversion upgrade

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/workspace/analysis-workspace.tsx`
- Modify: `src/app/globals.css`

- [ ] Replace the current minimal homepage framing with a compact hero plus launch-card layout.
- [ ] Add concise value copy and short proof or capability items without turning the page into a marketing landing page.
- [ ] Upgrade the visual treatment of the launch card, primary action, error banner placement, and advanced panel framing.
- [ ] Preserve existing submit behavior, saved-draft hydration, sample loading, and reduced-field advanced flow.

### Task 3: Lock the professional analysis-page hierarchy in tests

**Files:**
- Modify: `src/app/analysis/page.test.tsx`
- Modify: `src/components/workspace/result-view.test.tsx`

- [ ] Assert that the analysis page still renders the empty state and stored-result path.
- [ ] Assert that the result page leads with a verdict-first briefing and directive action area.
- [ ] Assert that audience-specific report paths still differ for solo-player, coach, and creator views.
- [ ] Run the result-focused tests first and confirm they fail against the old hierarchy before implementation.

### Task 4: Implement the analysis-page professional refinement

**Files:**
- Modify: `src/app/analysis/page.tsx`
- Modify: `src/components/workspace/result-view.tsx`
- Modify: `src/app/globals.css`

- [ ] Reframe the analysis page header as a replay briefing shell with calmer metadata presentation.
- [ ] Strengthen the verdict and action modules so users see conclusion, next steps, and summary highlights before evidence.
- [ ] Refine the objective timeline, evidence blocks, and appendix treatment so the page reads like a coherent post-match report.
- [ ] Preserve audience-specific sequencing and the lower expandable full-report section.

### Task 5: Verify the refinement end to end

**Files:**
- No code changes required unless verification finds issues

- [ ] Run targeted homepage and analysis-page tests.
- [ ] Run the full test suite.
- [ ] Run lint.
- [ ] Run build.
- [ ] Fix any regressions before reporting completion.
