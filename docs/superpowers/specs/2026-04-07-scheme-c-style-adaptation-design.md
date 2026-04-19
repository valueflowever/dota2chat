# Scheme C Style Adaptation Design

## Summary

Adapt the production pages to use the visual language of Style Lab scheme C without copying scheme C's spectator-HUD layout. The live product should stay direct and task-first, while gaining a sharper cyber tool aesthetic through color, surface treatment, spacing, and typography.

## Problem

The current app structure is already closer to the desired product flow than the style-lab mockups, but the visual identity is unstable:

- Earlier fantasy-heavy styling drifted away from the user's idea of Dota 2.
- Scheme C has the right atmosphere, but its sample layout is too literal and too game-client-shaped for the real product.
- The user explicitly does not want obvious Dota mechanic labels or in-client module clones on the final production pages right now.

We need a narrower adaptation rule so implementation stays aligned.

## Product Goal

Make the real app feel like a premium cyber analysis tool: darker, cleaner, denser, and more intentional than the current UI, while preserving the existing "open page, understand it immediately, start using it" workflow.

## Non-Goals

- Do not copy the scheme C page structure.
- Do not recreate a fake in-game observer HUD.
- Do not add strong Dota 2 mechanic vocabulary such as buyback, Roshan, wards, courier, rune, twin gate, or lotus labels to the production UI in this pass.
- Do not add decorative hero bars, minimaps, unit panels, or inventory-slot simulations to the production UI in this pass.

## Chosen Direction

### Reference Boundary

Use scheme C as a style system reference only:

- deep navy-black foundation
- cold blue interface glow
- layered, client-like panel depth
- crisp information density
- restrained Radiant/Dire color influence only as subtle accent, not as literal labels

Do not use scheme C as a layout reference.

### Structural Rule

Keep the current production information architecture:

- homepage still leads directly into the usable workspace
- input flow remains straightforward and form-led
- results remain product content, not a fake spectator panel

This means the app should still read like a web product first, not a game overlay first.

## Visual System

### Color

- Replace warm fantasy tones with a cooler palette centered on ink blue, steel blue, slate, and controlled cyan glow.
- Use muted green and muted red only as minor state accents, never as dominant theme blocks.
- Avoid gold-heavy, relic-like, or parchment-like color treatment.

### Surfaces

- Cards should feel closer to client panels than editorial blocks.
- Use darker fills, subtle inner borders, cooler highlight edges, and soft layered shadows.
- Prefer sharp or semi-sharp radii over soft fantasy rounding where it improves the scheme C feel.

### Typography

- Keep the existing product copy readable and direct.
- Increase visual contrast through stronger heading hierarchy and tighter supporting text rhythm.
- Avoid event-page or lore-page styling.

### Interaction

- Buttons, tabs, chips, and focus states should feel more like precision controls than marketing CTAs.
- Hover and focus states should use restrained light and contrast rather than dramatic fantasy glow.
- Inputs should remain obvious and friendly to use; style must not reduce form clarity.

## Page Adaptation Rules

### Homepage

- Preserve the current "arrive and use immediately" layout.
- Re-skin the page shell, header area, and workspace framing with scheme C surface treatment.
- Keep introductory copy minimal.

### Analysis Workspace

- Preserve current field order and workflow.
- Re-style section containers, labels, grouped controls, timeline builder, and action buttons using the scheme C visual system.
- Increase visual separation between primary action, supporting metadata, and optional detail areas.

### Result View

- Keep the current report structure and reading order.
- Re-style summary, issue cards, breakdown blocks, and timestamp sections so they feel more like a serious analysis console than a fantasy report.
- Maintain strong readability for longer text.

### Style Lab

- Keep `/style-lab` as a reference page only.
- Scheme C remains the visual source, not the production blueprint.

## Implementation Scope

The first implementation pass should focus on:

- `src/app/page.tsx`
- `src/components/workspace/analysis-workspace.tsx`
- `src/components/workspace/result-view.tsx`
- `src/app/analysis/page.tsx` if route-level framing needs alignment
- `src/app/globals.css`

Additional file splits are optional only if existing files become hard to maintain during the re-skin.

## Error Handling And Usability Guardrails

- Styling changes must not hide validation, loading, or error states.
- Contrast must stay strong enough for dense result content.
- Mobile layout must remain usable without HUD-like crowding.
- Any decorative treatment must degrade gracefully when content grows.

## Testing Strategy

- Update component tests only where visible production copy or semantic structure changes.
- Add or update assertions for key labels only when needed to prevent brittle style-only tests.
- Run full `npm test`, `npm run lint`, and `npm run build` after the re-skin.

## Assumptions

- The style-lab page is a working visual reference, not a route users rely on for core workflow.
- The user wants a cleaner cyber analysis product now, and may revisit stronger Dota-specific flavor later.
- Because the workspace is still mid-iteration with many uncommitted changes, this design doc is written locally without a commit requirement in this pass.
