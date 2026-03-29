# DoongD

Main repository for the **DoongD** game project.

DoongD is a dark-fantasy, retro-JRPG-inspired project centered on a dragon nest, outside actions, defensive battles, run progression, and route-based storytelling.

## Repository Role
This repository is the **main source of truth** for:
- project vision
- milestone planning
- validated design decisions
- approved art/audio direction
- prototype promotion targets
- future Unity project root structure

Fast experimentation happens separately in the prototype repository.

## Repositories
- Main repo: <https://github.com/1xp-muhee/DoongD>
- Prototype repo: <https://github.com/1xp-muhee/DoongDPrototype>

## How to Use This Repo
### If you are defining the product
Start here:
- `docs/project-overview.md`
- `planning/development-blueprint.md`
- `planning/mvp-finalize.md`
- `planning/run-roadmap.md`

### If you are defining player experience
Read:
- `design/core-experience.md`
- `design/combat-spec.md`
- `design/story-structure.md`

### If you are preparing production assets
Read:
- `art/art-direction.md`
- `audio/sound-direction.md`

### If you are integrating prototype outputs
Read:
- `prototype/PROTOTYPE_CONNECTION_STRATEGY.md`
- `prototype/PROTOTYPE_PROMOTION_RULES.md`
- `prototype/notes/current-prototype-status.md`

### If you are preparing the future Unity project
Read:
- `game/UNITY_ROOT_STRUCTURE.md`

## Directory Guide
- `docs/` — durable references and technical docs
- `planning/` — roadmap, MVP, milestones, production plan
- `design/` — gameplay, structure, system-facing design docs
- `art/` — art direction and approved visual references
- `audio/` — sound direction and approved audio references
- `prototype/` — prototype connection strategy, promotion rules, handoff notes
- `game/` — planned future Unity root structure
- `build/` — future build/release notes and outputs metadata
- `ops/` — process, automation, and team-facing operating docs

## Operating Model
- Prototype first in `DoongDPrototype`
- Promote only validated outcomes into `DoongD`
- Keep this repository cleaner, more intentional, and more stable than the prototype repo

## Current Status
The project currently has:
- design and planning documents
- prototype connection strategy
- Unity structure planning
- a separate experimental prototype repository with scripts, editor automation, and generated draft art

What is still pending:
- verified Unity runtime execution
- integrated scene wiring validation
- playable end-to-end demo verification inside Unity

## Immediate Next Milestones
1. verify Unity executable/environment
2. run prototype automation inside Unity
3. validate scene wiring and play loop
4. fix first integrated bugs
5. begin promotion of accepted prototype outputs into the main repo structure
