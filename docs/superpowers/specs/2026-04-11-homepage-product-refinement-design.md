# Homepage Product Refinement Design

## Summary

Refine the intake homepage into a product-grade Dota 2 replay analysis entry with a cleaner hero layout, a more premium search card, and a shorter advanced configuration area.

## Problem

The current intake page feels visually unfinished and the advanced section expands into a long form that overwhelms the core action. The experience needs to feel more deliberate, more premium, and more focused on starting analysis quickly.

## Goals

- Make the homepage feel like a polished product instead of a prototype.
- Keep the match ID input and submit action as the primary focus.
- Reduce the advanced area to the highest-value controls only.
- Preserve the current request lifecycle, session persistence, and analysis navigation flow.

## Non-Goals

- No API or schema changes.
- No analysis result page redesign in this pass.
- No new product capabilities beyond presentation and field prioritization.

## Chosen Direction

Use a card-based product homepage with a soft editorial background, a compact hero section, and a refined central search card. The visual language should feel calm, premium, and modern rather than esports-noisy or aggressively minimal.

## Homepage Structure

### Hero

- Compact status eyebrow
- Strong title
- One-sentence value proposition
- Short proof or capability chips

### Search Card

- Advanced settings toggle as a secondary icon action
- Match ID input as the dominant control
- Primary submit button as the main conversion point
- Inline error handling preserved

### Trust / Capability Row

- Short supporting statements that explain what the analysis returns
- Kept intentionally brief so the search card remains dominant

## Advanced Section Scope

Keep only these controls in the expanded advanced section:

- Audience / identity
- Analysis mode
- Focus question
- Output tone
- Sample load action
- Key timeline moments

Hide the lower-frequency metadata fields from the homepage advanced area:

- Context summary
- Skill bracket
- Role
- Lane
- Match title
- Patch
- Draft summary
- Lane outcome
- Replay notes
- Transcript

These hidden fields still remain in the request shape with their default empty values, so no backend or storage changes are required.

## Interaction Notes

- Default view stays compact and search-led.
- Advanced section expands beneath the primary card.
- Timeline editing remains optional.
- Sample loading should still populate all known request fields and reveal the advanced area.

## Testing Strategy

- Update homepage tests to reflect the new premium hero copy and supporting chips.
- Update workspace tests to assert the reduced advanced field set.
- Preserve tests for submit behavior, persistence, sample loading, and timeline validation.

## Assumptions

- The approved design discussion in the session serves as design approval for implementation.
- The change is intentionally limited to the homepage intake flow in this pass.
