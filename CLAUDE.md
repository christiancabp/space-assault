# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Space Assault is a 3D space shooter game built with React Three Fiber. It's a Galaga-style game with:

- Third-person behind-the-ship perspective
- Streaming star field for motion illusion
- Enemies that approach slowly then dive fast
- Simple collision detection

## Development Commands

```bash
npm run dev      # Start dev server with HMR (localhost:5173)
npm run build    # Type-check with tsc then bundle with Vite
npm run lint     # Run ESLint on all files
npm run preview  # Preview production build locally
```

## Tech Stack

- React 19 + TypeScript + Vite
- @react-three/fiber - React renderer for Three.js
- @react-three/drei - R3F utilities
- Zustand - State management

## Architecture

### File Structure

``` bash
src/
├── App.tsx                 # Game + UI overlay orchestration
├── audio/                  # soundManager.ts - Web Audio SFX/music (gain buses, phase-driven)
├── config/
│   ├── gameConfig.ts       # Tunable values (speeds, bounds, EXPLOSIONS, SCREEN_SHAKE, AUDIO, BLOOM, UI)
│   ├── shipConfigs.ts      # Ship transforms, hitboxes, engine mounts
│   └── enemyConfigs.ts     # Invader transforms, hitboxes, explosion tints
├── effects/                # ExplosionManager, ScoreFloaterManager, EnginePropulsion + GLSL shaders
├── entities/               # Player, Enemy, Bullet, Stars, MenuShip components
├── game/                   # Canvas (Game), Scene, GameLoop, CameraRig (menu drift + shake),
│                           # PlayAreaManager (frustum-derived bounds), PostFX (bloom)
├── hooks/                  # useKeyboard
├── input/                  # touchInput.ts - shared mutable touch state + fullscreen helper
├── invaders/               # InvaderModel (config-driven, drei <Clone>)
├── ships/                  # Ship components (gltfjsx-generated)
├── shipSelector/           # Ship carousel + preview canvas
├── stores/                 # Zustand: game, player, enemy, bullet, effects (explosions/floaters/
│                           # trauma), settings (persisted audio prefs), playArea (live bounds)
├── systems/                # collisionSystem (also triggers explosion/shake/SFX feedback)
├── types/                  # game.types.ts, ship.types.ts
└── ui/                     # HUD, menus, LoadingScreen, DamageFlash, TouchControls, AudioSettings

public/
├── models/                 # Ship GLBs (+ models/invaders/ for enemies)
├── sounds/                 # CC0 SFX + music (see ATTRIBUTION.md)
└── textures/               # CC0 nebula backdrop (see ATTRIBUTION.md)
```

### 3D Models

GLB model files are in `public/models/` and loaded at runtime. Ship components in `src/ships/` are generated via `gltfjsx`.

| Model File | Component | Status | Description |
|------------|-----------|--------|-------------|
| rocketship.glb | `Rocketship.tsx` | Active | Spaceship |
| guardians-ship.glb | `GuardiansShip.tsx` | Active | Milano from Guardians of the Galaxy |
| planet-express.glb | `PlanetExpress.tsx` | Active | Planet Express SpaceShip |
| rick-n-morty.glb | `RickNMorty.tsx` | Active | Rick's ship from Rick and Morty |
| sayan-capsule.glb | `SayanCapsule.tsx` | Active | Vegeta SpaceShip |
| space-shuttle.glb | `SpaceShuttle.tsx` | Active | Space Shuttle |
| starship.glb | `Starship.tsx` | Active | SpaceX Starship |
| tie-fighter.glb | `TieFighter.tsx` | Active | T.I.E Fighter |
| time-machine.glb | `TimeMachine.tsx` | Active | Dragon Ball Time Machine |

Enemy models live in `public/models/invaders/` (invader_1/3/5, boss_invader — classic Space Invaders sprites) and are rendered by the config-driven `src/invaders/InvaderModel.tsx` via drei `<Clone>`; per-type transforms/hitboxes/explosion tints are in `src/config/enemyConfigs.ts`.

All models are CC-BY-4.0 licensed. `scripts/measure-glb.mjs [dir]` prints each model's bounding box and center (useful for setting `shipConfigs.ts`/`enemyConfigs.ts` scale/offset values; defaults to `public/models/`).

### Key Patterns

1. **useFrame for game loop** - All entity updates use `useFrame` with delta time for frame-rate independent movement
2. **Zustand outside React** - Collision system uses `getState()` to access stores without subscriptions
3. **useRef for meshes** - Direct mesh manipulation in useFrame avoids re-renders
4. **Entity-Manager pattern** - Manager subscribes to array, Entity handles its own behavior (also used for explosions and score floaters)
5. **Layered rendering** - R3F Canvas always renders; HTML UI overlays conditionally based on game phase
6. **Direct store calls, no event bus** - collisionSystem triggers feedback (spawnExplosion, addTrauma, playSfx) the same way it removes entities
7. **Module-level mutable input** - keyboard Set and touchInput object are read in useFrame without re-renders; Player merges both (stick deflection >0.6 = digital press, so double-tap logic covers double-flick)
8. **Trauma screen shake** - hits add trauma (0..1), CameraRig renders trauma² as detuned-sine offsets and decays it

### Lint Gotchas (React Compiler rules)

- `react-hooks/purity`: `Math.random()` in `useMemo` is flagged - wrap one-time random buffer generation in targeted `eslint-disable` blocks (see Stars.tsx, Explosion.tsx)
- `react-hooks/set-state-in-effect`: no synchronous setState in effect bodies - use adjust-state-during-render (DamageFlash.tsx) or setState inside timeout callbacks (LoadingScreen.tsx)

### Verification Workflow

In-browser checks use Chrome DevTools MCP: dispatch synthetic `KeyboardEvent`s/`PointerEvent`s to drive gameplay (keyboard listeners mount with Player, so dispatch AFTER the phase change renders). Mobile: `emulate` viewport `390x844x3,mobile,touch`. The automation browser caps rAF at 30fps - don't trust FPS measurements from it. `requestFullscreen` needs a trusted CDP click, not a synthetic JS click.

### Coordinate System

- X-axis: Left/Right (player movement)
- Y-axis: Up/Down (player movement)
- Z-axis: Back (+) to Front (-) - enemies come from negative Z toward player at Z=0
- Camera: Behind and above player at [0, 8, 10] during gameplay (see `GAME_CONFIG.CAMERA`; menu pose in `GAME_CONFIG.UI.MENU_CAMERA`)

### Game Flow

`menu` ↔ `shipSelect`; `menu` → `playing` ↔ `paused` → `gameOver` → back to `menu` or `playing`

A LoadingScreen overlay (drei `useProgress`) covers everything until assets settle. The camera belongs to CameraRig in all phases: cinematic drift on the menu, eased transition into the gameplay pose on start, trauma shake during play.

## Configuration

Configuration is split across `src/config/`:

**`gameConfig.ts`** - Tunable game values:
- Player speed and bounds
- Bullet speed and fire rate
- Enemy spawn rate and speeds
- Colors, sizes, etc.

**`shipConfigs.ts`** - Per-ship configuration:
- Transform (scale, rotation, position offset)
- Hitbox dimensions
- Engine mounts (drive the EnginePropulsion flame shaders)

**`enemyConfigs.ts`** - Per-invader configuration (transform, hitbox, explosion color)

Play bounds are NOT fixed: `PlayAreaManager` intersects the designed `PLAYER_BOUNDS` with the visible frustum at the player plane, so portrait/mobile viewports get a tall, thin play area automatically. Player movement and enemy spawns read `playAreaStore`, not the config directly.

## Controls

**Keyboard:** WASD/Arrows move · Space fires · double-tap Left/Right barrel-rolls (invincible dodge) · Enter starts/pauses/resumes/restarts

**Touch** (coarse-pointer devices only, during gameplay): joystick bottom-right (double-flick = barrel roll) · hold-to-fire bottom-left · pause top-right. START GAME requests fullscreen on mobile (iPhone Safari lacks the API - standalone home-screen launch is its fullscreen path).

## Asset Sourcing

CC0 audio/textures came from OpenGameArt (direct file URLs work with curl; kenney.nl's downloads are JS-gated). Keep attribution files in `public/sounds/` and `public/textures/` updated when adding assets. When adding GLBs, don't assume gltfjsx node structure is uniform across files - `InvaderModel` uses drei `<Clone object={scene}>` for that reason.
