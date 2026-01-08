# Space Assault

A 3D space shooter game built with React Three Fiber. Galaga-style gameplay with a modern tech stack.

## Play

```bash
npm install
npm run dev
```

Open <http://localhost:5173> in your browser.

## Controls

| Key              | Action                 |
| ---------------- | ---------------------- |
| W / Arrow Up     | Move up                |
| S / Arrow Down   | Move down              |
| A / Arrow Left   | Move left              |
| D / Arrow Right  | Move right             |
| Space            | Fire                   |
| Enter            | Start / Pause / Resume |

## Features

- Third-person behind-the-ship perspective
- Streaming star field for motion illusion
- Enemies that approach slowly then dive fast
- AABB collision detection
- Pause/resume functionality
- Score tracking and lives system

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Three Fiber** - React renderer for Three.js
- **Drei** - R3F utilities
- **Zustand** - State management

## Scripts

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Type-check and build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Project Structure

```text
src/
├── App.tsx           # Game + UI orchestration
├── game/             # R3F Canvas, Scene, GameLoop
├── entities/         # Player, Enemy, Bullet, Stars
├── stores/           # Zustand state (game, player, enemy, bullet)
├── systems/          # Collision detection
├── hooks/            # Keyboard input
├── types/            # TypeScript definitions
├── constants/        # Game configuration
└── ui/               # HUD, menus, pause screen
```

## 3D Models

Ship models in `src/assets/` (CC-BY-4.0 licensed):

| Folder | Component | Model |
|--------|-----------|-------|
| planet-express | `PlanetExpress.tsx` | Planet Express SpaceShip |
| rick-n-morty | `RickNMorty.tsx` | Rick's ship from Rick and Morty |
| rocketship | `Rocketship.tsx` | Spaceship |
| sanitation-ship | `SanitationShip.tsx` | Space Garbage Truck |
| sayan-capsule | `SayanCapsule.tsx` | Vegeta SpaceShip |
| space-shuttle | `SpaceShuttle.tsx` | Space Shuttle |
| starship | `Starship.tsx` | SpaceX Starship |
| tie-fighter | `TieFighter.tsx` | T.I.E Fighter |
| time-machine | `TimeMachine.tsx` | Dragon Ball Time Machine |

## Configuration

Game parameters can be tuned in `src/constants/gameConfig.ts`:

- Player speed and movement bounds
- Bullet speed and fire rate
- Enemy spawn rate, speeds, and spawn ranges
- Colors and sizes
