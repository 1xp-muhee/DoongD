# Prototype Promotion Rules

## Purpose
Define when work from `DoongDPrototype` is allowed to move into the main repository `DoongD`.

## Promotion criteria
A prototype artifact can be promoted only if at least one of the following is true:
- it proves a core gameplay loop works better than the previous baseline
- it reduces integration cost for the planned Unity project
- it becomes a stable reference for art, UX, or system design
- it is required to unblock milestone planning or team handoff

## What gets promoted
- distilled design decisions
- validated C# systems worth preserving
- approved generated art direction or asset candidates
- editor automation scripts that save manual production time
- playtest findings and bug patterns with durable value

## What does NOT get promoted directly
- throwaway experiments
- duplicated draft documents
- unreviewed generated assets
- temporary hacks with unclear behavior
- artifacts that only made sense under prototype-only constraints

## Promotion workflow
1. Identify candidate in `DoongDPrototype`
2. Summarize purpose, status, limitations
3. Re-home into correct folder in `DoongD`
4. Rewrite for clarity and permanence
5. Mark remaining gaps or verification needs

## Target folders in main repo
- systems/design decisions -> `design/`
- planning/roadmap -> `planning/`
- technical references -> `docs/`
- art direction / approved assets -> `art/`
- audio direction / approved references -> `audio/`
- prototype handoff notes -> `prototype/notes/`
- future Unity implementation root -> `game/`

## Verification tags
Use one of these labels in promotion notes:
- `draft-promoted`
- `prototype-validated`
- `needs-unity-verification`
- `approved-reference`
