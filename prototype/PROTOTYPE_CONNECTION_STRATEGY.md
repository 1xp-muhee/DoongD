# DoongD Prototype Connection Strategy

## Repositories
- Main repo: `DoongD`
- Prototype repo: `DoongDPrototype`

## Roles
### DoongD (main)
- source of truth for vision, roadmap, design, art/audio direction
- integration target for validated prototype outcomes
- release-facing project documentation and milestone tracking

### DoongDPrototype
- fast experimentation sandbox
- battle/UI/editor automation tests
- generated draft assets and throwaway implementation spikes

## Operating rule
Prototype first, main second:
1. Build or test quickly in `DoongDPrototype`
2. Validate what is actually useful
3. Promote only accepted results into `DoongD`

## Promotion workflow
- Code proven useful in prototype -> copied or re-integrated into main under `prototype/` or future `game/`
- Draft art that passes review -> moved into `art/approved/` or referenced from asset registry
- Experimental docs -> distilled into `docs/`, `planning/`, or `design/`

## Current recommendation
Use manual promotion for now.
Do not use submodules yet.
Once Unity project structure stabilizes, absorb selected prototype outputs into the main repo.

## Near-term structure plan
- `prototype/notes/` : prototype summaries and import checklists
- `prototype/integration/` : accepted scripts/assets waiting for Unity integration
- future `game/` : main Unity project when actual executable project root is established
