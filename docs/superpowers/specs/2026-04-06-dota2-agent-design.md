# Dota 2 Agent Replay Review Design

## Summary

Build a Next.js replay analysis service for Dota 2 users who want practical feedback from match recordings, replay notes, or observer transcripts. The first version should feel production-minded rather than like a prompt playground: users choose their role, add only the context they actually have, and receive an analysis report shaped around the way they work.

## Problem

Most replay review tools are either:

- Too generic, so the advice reads like broad motivational copy.
- Too expert-only, so solo players and creators cannot quickly get value.
- Too input-heavy, so users abandon the workflow before analysis starts.

We need a service that helps different user types move from “I have a replay” to “I know what to fix next” with minimal friction.

## User Segments

### Solo Ranked Players

Need a fast review that identifies repeated mistakes, role-specific opportunities, and 1-3 drills for the next queue.

### Team Captains and Coaches

Need structured phase-by-phase feedback covering draft, lanes, objective setup, teamfight spacing, and communication gaps.

### Content Creators and Analysts

Need storyline extraction, highlight moments, audience-friendly phrasing, and clip suggestions they can reuse in scripts or overlays.

## Product Goals

- Make first analysis possible in under three minutes with sample data and guided inputs.
- Support both lightweight inputs and deep-review workflows.
- Produce evidence-based outputs with timestamps, confidence notes, and next actions.
- Keep the UI understandable for casual players while still rewarding advanced users.

## Non-Goals

- Full `.dem` parsing in this iteration.
- Real-time video processing in-browser.
- User accounts, billing, team spaces, or storage backends.

## Approaches Considered

### 1. Dense analyst console

Best for professional reviewers, but high cognitive load for solo users and poor onboarding for first-time visitors.

### 2. Step-by-step wizard

Great for newcomers, but too slow for repeat use and frustrating for coaches who already know what they want to enter.

### 3. Hybrid guided workspace (recommended)

Use a polished marketing-style landing page plus a single analysis workspace with progressive disclosure. New users get presets, samples, and contextual help; advanced users can jump directly into detailed fields and timeline entries.

## Chosen Experience

### Information Architecture

- Landing section that explains value, supported user types, and the service workflow.
- Analysis workspace with:
  - Audience preset selection
  - Focus mode selection
  - Replay context form
  - Timeline builder
  - Transcript / observer notes area
  - Results panel
- Prompt transparency section so users can understand how the agent reasons.

### UX Principles

- Start from role, not from raw fields.
- Show only the fields needed to produce a useful answer.
- Reward detail with richer output rather than requiring it.
- Make the result scannable first, deep second.
- Keep mobile layout fully usable for quick reviews.

## Domain Model

The analysis request should capture:

- Audience type
- Analysis mode
- Skill bracket
- Role and lane
- Match metadata
- Draft summary
- Lane outcome
- Replay notes
- Timeline events
- Transcript or observer notes
- Desired output tone

The response should include:

- Executive summary
- Match verdict
- Priority issues
- Phase breakdown
- Timestamp moments
- Practice plan
- Audience-specific add-ons such as content angles or team follow-ups

## Agent Design

### Prompt Strategy

Use a layered prompt:

1. System prompt that defines the agent as a Dota 2 replay analyst with strong coaching discipline.
2. Role modifier that adapts tone and priorities for solo players, coaches, or creators.
3. Analysis mode modifier that changes the output depth and structure.
4. User payload built from validated request data.

### Prompt Principles

- Never claim to see events that were not provided.
- Separate strong conclusions from lower-confidence inferences.
- Always tie recommendations to timestamps or specific replay evidence when available.
- Convert criticism into practical next actions.
- Prefer concise action language over generic esports jargon.

### Engine Strategy

The service should support two modes:

- Live AI mode is owned by the backend service; the frontend should only forward analysis requests.
- Local fallback mode that synthesizes a believable structured report from the submitted data so the product still works during setup or demos.

## Frontend Design Direction

- Editorial, energetic layout with warm neutrals, ember orange, map green, and steel blue.
- Strong typography using non-default fonts.
- Layered backgrounds and card depth instead of flat utility-panel aesthetics.
- A dashboard that feels supportive, not intimidating.
- Data density in results, softness in input areas.

## Component Breakdown

- `app/page.tsx`: page shell and section composition.
- `components/landing/*`: hero, persona switcher, workflow, prompt explainer.
- `components/workspace/*`: form panels, mode cards, timeline builder, result renderer.
- `lib/analysis/*`: schemas, prompt builders, local engine, output formatter.
- `app/api/analyze/route.ts`: validation and server-side analysis entrypoint.

## Error Handling

- Validate input with friendly field-level copy.
- Support empty-state samples so users are never blocked.
- Show whether results are from live AI or local demo mode.
- Return partial results only when data is sufficient to produce something honest.

## Testing Strategy

- Unit tests for request validation and prompt assembly.
- Unit tests for the local fallback engine to keep deterministic sections stable.
- API route tests for success and validation failure.
- Component tests for high-value UI states such as persona switching and result rendering.

## Delivery Scope For This Iteration

- One polished landing-plus-workspace page.
- Structured API with prompt generation.
- Live AI integration with graceful fallback.
- Sample data presets for multiple user types.
- Automated tests for core analysis logic and at least one UI path.

## Assumptions

- Users can provide replay context manually even if raw video analysis is not available yet.
- The most important win for this version is actionable review output, not asset persistence.
- Because the workspace started empty and without git history, the design doc is written locally without a commit requirement in this pass.
