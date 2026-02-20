# Copilot Instructions for Game Development

This is a **Next.js + Phaser 3 browser-based RPG** with a strict MVP architecture and reactive state management using RxJS.

## Architecture Overview

### Scene Management Pipeline
- **SceneController** (app/(game)/core/SceneController.ts) is the central hub that listens to `GameStateManager.state$` and orchestrates scene transitions
- Game flows through states: START → LOAD → FIELD ↔ BATTLE/EVENT/MENU → GAME_OVER
- Scenes are launched/paused using Phaser's scene system, NOT replaced directly
- Always update state through `GameStateManager.updateState()`, never change scenes directly

### MVP Pattern (Consistent Across Subsystems)

**Model**: Pure data logic, no side effects
- Example: [BattleModel.ts](app/(game)/battle/model/BattleModel.ts) holds party data, damage calculations
- Example: [FieldMapModel.ts](app/(game)/gamemain/model/FieldMapModel.ts) manages map state

**Presenter**: Coordinates Models and Views, handles subscriptions
- Example: [BattlePresenter.ts](app/(game)/battle/presenter/BattlePresenter.ts) manages battle flow via StateMachine
- Example: [FieldPresenter.ts](app/(game)/gamemain/presenter/FieldPresenter.ts) coordinates map rendering and input
- **Critical**: Always collect RxJS subscriptions in `private subs = new Subscription()` and unsubscribe in `destroy()`/cleanup

**View**: Phaser game objects (Sprites, Text, Windows)
- Example: [BattleSelectWindow.ts](app/(game)/battle/view/BattleSelectWindow.ts) renders UI elements
- Views receive data from Presenter, don't manage state directly
- Views are created in `create()` after `init()` is called on the Presenter

### State Management: RxJS + BehaviorSubject

[GameStateManager.ts](app/(game)/GameAllState/GameStateManager.ts) is a singleton using RxJS:
- **Internal state**: `gameState$` BehaviorSubject holds complete game state
- **Exposed Observables**: `state$`, `money$`, `onStartField$` etc. (use `.pipe(map(), filter())` for specific data)
- **Pattern**: Call `manager.updateState({ state: State.FIELD, ... }, sceneKey)` → triggers subscribers → SceneController reacts
- State changes are immutable: always pass new state objects, never mutate

### Input Handling: Context-Aware Actions

[InputManager.ts](app/(game)/core/input/InputManager.ts) converts Phaser keyboard events to RxJS actions:
- Define action names in [InputConfig.ts](app/(game)/core/input/InputConfig.ts) (e.g., `UP`, `DOWN`, `CONFIRM`)
- Presenters subscribe to `inputManager.action$` Observable
- Same key has different meaning per context (up = move in field, up = scroll in menu) → handle in Presenter, not Input layer
- Enable/disable input via `inputManager.setState(true/false)` during transitions

## Key Subsystems & Patterns

### Battle System
[BattlePresenter.ts](app/(game)/battle/presenter/BattlePresenter.ts) coordinates:
- Models: BattleModel (party/enemy data), CommandSelectModel (turn order), TurnModel (damage calculations)
- Views: BattleSelectWindow, PlayerPartyWindow, AttackSelectWindow, EnemySelectWindow, BattleMessageWindow  
- StateMachine: Tracks command confirmation, attack execution, enemy turn, victory/defeat
- Data flows: InputAction → Presenter → Model → View render

### Field System
[FieldPresenter.ts](app/(game)/gamemain/presenter/FieldPresenter.ts) coordinates:
- Models: FieldMapModel loads Tiled JSON maps
- Views: TileMap (Phaser.Tilemaps), MapObject (sprite/NPC management), CameraManager (follow player)
- PlayerPresenter listens to input and updates player position
- NpcPresenter manages NPC behavior and collision-triggered events

### Event System
[Event.ts](app/(game)/scenes/Event.ts) scene handles:
- Triggered by collision or map markers
- EVENT0001-EVENT0004.ts are event-specific presenters (see [event/view/](app/(game)/event/view/))
- EventBus used for cross-scene communication during event playback

## Critical Patterns & Gotchas

1. **Never directly mutate observables**: Use `distinctUntilChanged()` with custom comparators when same state value must trigger re-runs
2. **Subscription cleanup is mandatory**: Unsubscribe in `shutdown()` or `destroy()` to prevent memory leaks and phantom listeners
3. **Scene vs SceneKey distinction**: SceneKey (e.g., 'menu', '0001') is used to resume correct field after battle—always pass it in state updates
4. **Phaser scale configuration**: Uses FIT mode at 1280×720; handle orientation change in [main.ts](app/(game)/main.ts) with 100ms delay
5. **Sound scene isolation**: Sound.ts runs in parallel—emit events like `BGM_BATTLE` or `BGM_FIELD` via `game.events.emit()`
6. **Tiled JSON maps**: Stored in `/public/assets/tiled/*.json`; MapKey in FieldData maps to `[mapKey].json`

## Build & Dev Workflow

```bash
npm run dev          # Start with Turbopack (hot reload enabled)
npm run build        # Production build
npm run lint         # ESLint (configured in eslint.config.mjs)
```

## Data Files & Configuration

- **Types**: [lib/types.ts](app/(game)/lib/types.ts) — GameState, FieldData, GameScene interface
- **Characters**: [Data/CharacterDefinition.ts](app/(game)/Data/CharacterDefinition.ts)
- **Dialogue**: [Data/BubbleTalkData.ts](app/(game)/Data/BubbleTalkData.ts)
- **Maps**: `/public/assets/tiled/` (Tiled-exported JSON; loaded by FieldMapModel)
- **Images**: `/public/assets/img/` (sprites, backgrounds, icons)

## Common Tasks

- **Add new input action**: Define in InputConfig, subscribe in relevant Presenter
- **Add new game state**: Add to State enum in types.ts, handle in SceneController.handleStateChange()
- **Add new scene**: Create in scenes/, implement GameScene interface, register in main.ts config
- **Add NPC/event**: Create in gamemain/view/character/, wire in NpcPresenter, use map markers in Tiled
- **Add battle logic**: Extend BattleModel, add strategy to StateMachine or TurnModel
