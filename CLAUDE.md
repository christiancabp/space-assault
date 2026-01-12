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
├── config/                 # Game and ship configuration
│   ├── gameConfig.ts       # Tunable game values (speeds, bounds, etc.)
│   └── shipConfigs.ts      # Ship transforms, hitboxes, engine mounts
├── entities/               # Player, Enemy, Bullet, Stars components
├── game/                   # R3F Canvas, Scene, GameLoop
├── hooks/                  # Custom hooks (keyboard input)
├── ships/                  # Ship components (gltfjsx-generated)
│   ├── Rocketship.tsx      # Active ship component
│   └── _wip/               # Ships needing TypeScript fixes
├── stores/                 # Zustand stores (game, player, enemy, bullet)
├── systems/                # Game systems (collision detection)
├── types/                  # TypeScript type definitions
│   ├── game.types.ts       # Game state types
│   └── ship.types.ts       # Ship config types (ShipId, ShipConfig, etc.)
└── ui/                     # HTML overlay components (HUD, menus)

public/
└── models/                 # GLB model files loaded at runtime
```

### 3D Models

GLB model files are in `public/models/` and loaded at runtime. Ship components in `src/ships/` are generated via `gltfjsx`.

| Model File | Component | Status | Description |
|------------|-----------|--------|-------------|
| rocketship.glb | `Rocketship.tsx` | Active | Spaceship |
| planet-express.glb | `PlanetExpress.tsx` | WIP | Planet Express SpaceShip |
| rick-n-morty.glb | `RickNMorty.tsx` | WIP | Rick's ship from Rick and Morty |
| sanitation-ship.glb | `SanitationShip.tsx` | WIP | Space Garbage Truck |
| sayan-capsule.glb | `SayanCapsule.tsx` | WIP | Vegeta SpaceShip |
| space-shuttle.glb | `SpaceShuttle.tsx` | WIP | Space Shuttle |
| starship.glb | `Starship.tsx` | WIP | SpaceX Starship |
| tie-fighter.glb | `TieFighter.tsx` | WIP | T.I.E Fighter |
| time-machine.glb | `TimeMachine.tsx` | WIP | Dragon Ball Time Machine |

WIP ships are in `src/ships/_wip/` and need TypeScript fixes before activation. All models are CC-BY-4.0 licensed.

### Key Patterns

1. **useFrame for game loop** - All entity updates use `useFrame` with delta time for frame-rate independent movement
2. **Zustand outside React** - Collision system uses `getState()` to access stores without subscriptions
3. **useRef for meshes** - Direct mesh manipulation in useFrame avoids re-renders
4. **Entity-Manager pattern** - Manager subscribes to array, Entity handles its own behavior
5. **Layered rendering** - R3F Canvas always renders; HTML UI overlays conditionally based on game phase

### Coordinate System

- X-axis: Left/Right (player movement)
- Y-axis: Up/Down (player movement)
- Z-axis: Back (+) to Front (-) - enemies come from negative Z toward player at Z=0
- Camera: Behind and above player at [0, 10, 15]

### Game Flow

`menu` → `playing` ↔ `paused` → `gameOver` → back to `menu` or `playing`

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
- Engine mounts (for future propulsion effects)

## Controls

- WASD / Arrow Keys: Move ship
- Spacebar: Fire bullets
- Enter: Start game, pause/resume, restart after game over
