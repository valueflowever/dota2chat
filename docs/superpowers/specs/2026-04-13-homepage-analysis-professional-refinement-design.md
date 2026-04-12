# Homepage And Analysis Professional Refinement Design

## Summary

Refine the intake homepage and `/analysis` result page into a more convincing Dota 2 replay analysis product. The homepage should increase conversion confidence without becoming a marketing page, and the analysis page should read like a professional post-match briefing with a clear conclusion, next actions, and supporting evidence.

## Problem

The current homepage works functionally, but it still feels closer to a compact demo entry than a high-trust product surface. It does not fully explain the value of submitting a match ID, and the search experience is visually lighter than the importance of the action it asks users to take.

The current analysis page already contains useful structure, but the professional hierarchy can be stronger. Some modules still read like parallel cards instead of a single coherent report with a conclusion-first narrative, a prioritized action layer, and a disciplined evidence trail.

## Goals

- Increase homepage conversion confidence by making the value of submission clear above the fold.
- Preserve a fast one-screen intake flow centered on the match ID input.
- Make the analysis page feel like a real replay review workspace rather than a generic product dashboard.
- Strengthen the reading order so users see verdict, action, and evidence in that order.
- Keep audience-specific presentation for solo-player, coach, and creator workflows.
- Preserve the current API, schema, route flow, and session-based storage behavior.

## Non-Goals

- No backend, schema, or request-shape changes.
- No route changes or new persistent navigation model.
- No mobile-focused redesign in this pass.
- No new analytics capabilities or derived match telemetry beyond current data and existing demo visualization helpers.
- No major interaction model changes beyond layout, copy, emphasis, and information hierarchy.

## Chosen Direction

Use a product-grade analysis console language across both pages:

1. Homepage as a high-trust analysis launch surface
2. Analysis page as a post-match briefing and evidence workspace

The visual tone should remain light, editorial, and restrained rather than dark-esports or heavy marketing. The strongest upgrade should come from clearer value communication, more intentional card hierarchy, calmer visual rhythm, and more report-like information structure.

## Homepage Design

### Role

The homepage should feel like the front desk of an analysis product, not a blank utility screen. Users should immediately understand what the tool does, what quality of output they will receive, and how to start.

### Above-The-Fold Structure

The homepage should remain a single primary screen with:

- A compact hero block
- A dominant analysis launch card
- A short trust or capability strip

The hero should not become a landing-page essay. The purpose is to frame the product and strengthen the submission decision, not to add marketing bulk.

### Hero Content

The hero should contain:

- A short product title
- A one-sentence value promise
- Three short capability or proof chips

The copy should emphasize outcomes such as identifying key swing moments, surfacing the next correction to make, and turning a replay into a readable review structure.

### Launch Card

The match ID input remains the primary action and the only required field. It should be presented inside a more substantial launch card that includes:

- A concise card title
- A small explanatory sentence
- The match ID input row
- A stronger primary submit button
- A secondary advanced-settings entry
- The sample-load shortcut

This card should feel like a deliberate analysis console, not only an inline form.

### Advanced Settings Positioning

Advanced settings should remain collapsed by default, but the presentation should shift from "more form controls" to "improve analysis framing." The expanded section should feel like a light strategy panel that helps shape the output rather than adding form burden.

The current high-value fields remain appropriate:

- Audience / identity
- Focus question
- Sample load action

The visual emphasis should explain that choosing an audience changes how the output reads, for example more like a solo-player correction pass, a coach review, or a creator breakdown.

### Trust Strip

Below the launch card, keep a very short supporting strip with brief product promises. This should reinforce confidence without creating a second focal point.

### Homepage Visual Direction

- Keep the existing light product direction
- Add more depth to the background with a restrained paper or tactical-grid atmosphere
- Make the launch card denser and more premium
- Strengthen primary-button authority
- Use calmer editorial spacing and higher contrast between hero copy, support copy, and secondary metadata

## Analysis Page Design

### Role

The analysis page should read as a replay briefing, not as a set of equally weighted widgets. A user should be able to land on the page and understand the conclusion before scanning the supporting detail.

### Primary Reading Order

The page should be organized as four layers:

1. Conclusion layer
2. Action layer
3. Evidence layer
4. Appendix layer

This order is the main source of the upgraded professional feel.

### Conclusion Layer

The top section should behave like a post-match brief:

- One-sentence verdict
- Supporting headline
- Short overview paragraph
- Compact metadata chips for match, audience, mode, source, and confidence

The verdict card should feel like the anchor of the entire page.

### Action Layer

Next to or immediately below the verdict, keep a directive card that answers what the user should do next. This should read more like an execution list than a generic issue card.

The action layer should:

- Highlight the top three next actions
- Use direct, operational phrasing
- Adapt wording by audience

For solo-player users, this should read like next-game corrections. For coach users, it should read like review priorities. For creator users, it should read like narrative angles and content hooks.

### Briefing Summary Cards

Retain the summary-card layer but sharpen its role. These cards should feel like briefing highlights rather than KPI blocks. They should summarize the most important practice focus, issue focus, or audience-specific hook while staying clearly subordinate to the verdict.

### Evidence Layer

The evidence layer should become more disciplined and report-like.

#### Objective Timeline

The objective timeline remains the primary evidence axis. It should feel like the main structural backbone of the review instead of a simple table block. The visual treatment should reinforce it as the top evidence panel.

#### Audience-Specific Modules

After the objective timeline, the evidence path should split by audience:

- Solo-player: key fights, key moments, practice plan
- Coach: phase review, key fights, coach lens
- Creator: story moments, creator lens, presentation-ready highlights

This keeps the page specialized without changing the underlying schema.

#### Supporting Side Panels

Input summary, audience lens, and MVP or mistake summaries should remain available but should read as supporting context rather than competing hero modules.

### Appendix Layer

The structured full report and prompt transparency should stay available in the lower expandable area. This appendix should be visibly lower-priority so it does not compete with the main review flow.

## Shared Interaction Notes

- Keep the existing `/` to `/analysis` flow unchanged.
- Keep session persistence unchanged.
- Keep the match ID as the only required field.
- Preserve sample loading behavior, including automatic reveal of advanced controls.
- Preserve the current empty-state path for missing stored analysis results.
- Improve homepage error placement so failures feel closer to the primary submission action.
- Avoid introducing new complex interactions in this pass; the improvement should come mainly from hierarchy, layout, and copy.

## Visual System Notes

- Preserve the light premium direction already established in the current project
- Increase consistency between homepage and analysis page
- Use cleaner section boundaries, calmer spacing, and more report-like small labels
- Reduce any remaining "generic card grid" feeling
- Favor confidence and readability over decorative motion or novelty

## Testing Strategy

Update the existing tests to lock in the refined UI contract:

- Homepage tests should assert the new value framing and launch-card structure.
- Homepage workspace tests should preserve submit behavior, sample loading, advanced-toggle behavior, and focus-question handling.
- Analysis page tests should assert the stronger verdict-first hierarchy.
- Result-view tests should preserve audience-specific module ordering and appendix availability.
- API and schema tests should remain unchanged unless a presentation detail requires minor expectation updates.

## Assumptions

- The user approved the homepage direction in-session on April 13, 2026.
- The user approved the analysis-page direction in-session on April 13, 2026.
- The user explicitly deprioritized mobile optimization for this pass.
- Existing report data and demo visualization helpers are sufficient to support the upgraded presentation without backend changes.
