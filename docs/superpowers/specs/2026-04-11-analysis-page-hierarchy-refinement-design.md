# Analysis Page Hierarchy Refinement Design

## Summary

Refine the `/analysis` experience so the page leads with a single clear verdict, then guides the user into the highest-priority actions and supporting evidence without overwhelming them on first view.

## Problem

The current result page contains useful information, but too many blocks compete for attention at the same time. The top of the page does not immediately answer the most important question, and the combination of dashboard cards, right rail content, and detailed report sections makes the hierarchy feel noisy.

## Goals

- Make the one-line verdict the clear primary focus above the fold.
- Reorder supporting information so users first understand the conclusion, then the next moves, then the evidence.
- Reduce visual noise and remove low-trust decorative panels that do not strengthen the analysis.
- Keep all current report data accessible without changing the report schema or route flow.

## Non-Goals

- No API or schema changes.
- No changes to how analysis results are stored or loaded.
- No new product capabilities beyond presentation and hierarchy refinement.

## Chosen Direction

Use a product-grade executive-summary layout with three layers:

1. Verdict layer
2. Action layer
3. Evidence and detail layer

This keeps the report useful for first-pass reading while still preserving deeper analysis for follow-up review.

## Information Architecture

### Layer 1: Verdict

- Strong page summary card
- Large one-line verdict as the main headline
- Supporting overview beneath it
- Small metadata chips for match ID, audience, mode, source, and confidence

### Layer 2: Actions

- Short list of the top three next actions derived from priority issues
- Compact summary cards for confidence, issue count, and practice focus
- Positioned immediately below or beside the verdict so the page answers “what should I do next?” without scrolling through evidence first

### Layer 3: Evidence

- Key moments presented as a clear chronological evidence sequence
- Phase breakdown shown as concise cards or matrix entries
- Input snapshot kept visible but visually subordinate
- Audience-specific lens and warnings grouped together instead of scattering them across the page

### Detailed Analysis

- Full structured detail preserved in a lower expandable section
- Prompt transparency kept, but nested deeper so it does not compete with the report summary

## Content Decisions

- Remove or demote the synthetic momentum chart because it adds visual mass without increasing trust.
- Keep key moments, but present them as evidence cards with stronger causal language.
- Keep priority issues, but emphasize the next move over the supporting prose in the summary layer.
- Keep the detailed breakdown for users who want to read everything, but collapse it behind a clear “full report” affordance.

## Visual Direction

- Match the refined homepage with a soft premium product surface rather than a dark esports dashboard.
- Use larger whitespace, fewer simultaneous card styles, and stronger typographic contrast.
- Favor light surfaces, restrained shadows, and warm-neutral accents.
- Treat the verdict card as the anchor, not as one card among many.

## Testing Strategy

- Update result-page tests to assert the new hierarchy labels.
- Preserve empty-state coverage.
- Preserve the ability to render all current report fields and prompt details.

## Assumptions

- The user approved direct implementation after choosing a verdict-first hierarchy.
- Existing analysis content is sufficient to populate the refined layout without additional derived metrics.
