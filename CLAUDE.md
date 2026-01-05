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
├── game/                   # R3F Canvas, Scene, GameLoop
├── entities/               # Player, Enemy, Bullet, Stars components
├── stores/                 # Zustand stores (game, player, enemy, bullet)
├── systems/                # Game systems (collision detection)
├── hooks/                  # Custom hooks (keyboard input)
├── types/                  # TypeScript type definitions
├── constants/              # Game configuration values
└── ui/                     # HTML overlay components (HUD, menus)
```

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

All tunable game values are in `src/constants/gameConfig.ts`:

- Player speed and bounds
- Bullet speed and fire rate
- Enemy spawn rate and speeds
- Colors, sizes, etc.

## Controls

- WASD / Arrow Keys: Move ship
- Spacebar: Fire bullets
- Enter: Start game, pause/resume, restart after game over
