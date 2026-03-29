# Planned Unity Root Structure

This folder is the planned future Unity project root for DoongD.

## High-level layout
- `Assets/Art/` : approved backgrounds, portraits, UI assets, icons
- `Assets/Audio/` : bgm, sfx, ambience, temporary licensed audio
- `Assets/Materials/` : shared materials/shaders if needed
- `Assets/Prefabs/` : reusable UI/world/combat prefabs
- `Assets/Resources/` : minimal runtime-loaded assets only when necessary
- `Assets/Scenes/` : MainNest, OutsideAction, BattlePrototype, Event, Title, Ending
- `Assets/Scripts/Runtime/` : gameplay code that ships
- `Assets/Scripts/Editor/` : editor tooling and automation
- `Assets/Scripts/UI/` : Canvas presenters and UI controllers
- `Assets/Scripts/Systems/` : save/load, progression, event flow, economy
- `Assets/Scripts/Combat/` : battle loop, units, waves, skills, traps
- `Assets/Scripts/World/` : map flow, outside actions, location logic
- `Assets/Scripts/Data/` : data definitions, enums, scriptable schemas
- `Assets/ScriptableObjects/` : authored game data assets
- `Assets/StreamingAssets/` : external/imported payloads only if needed
- `Packages/` : Unity package manifest
- `ProjectSettings/` : Unity project settings

## Suggested scene set
- `Title.unity`
- `MainNest.unity`
- `OutsideAction.unity`
- `Battle.unity`
- `Event.unity`
- `Ending.unity`

## Promotion path from prototype
- prototype scripts first land in `Assets/Scripts/Combat`, `UI`, `Systems`, or `Data`
- generated draft art first lands in `Assets/Art/Draft/`
- approved assets later move to stable production folders

## Rule
`game/` should stay empty of accidental junk until Unity executable/environment is confirmed.
Use it as the planned authoritative layout, not a dumping ground.
