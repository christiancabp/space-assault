# Space Assault - Development Progress

## Phase 1: Core Gameplay - COMPLETE!

### Step 1: Project Setup

- [x] Install dependencies (three, @react-three/fiber, @react-three/drei, zustand)
- [x] Create TODO.md for progress tracking
- [x] Update index.css for dark fullscreen

### Step 2: Core R3F Setup

- [x] Create `src/game/Game.tsx` - Canvas with camera config
- [x] Create `src/game/Scene.tsx` - Ambient + directional lighting
- [x] Update `src/App.tsx` - Render Game component

### Step 3: Type Definitions & Config

- [x] Create `src/types/game.types.ts` - Entity, Vector3, GamePhase
- [x] Create `src/constants/gameConfig.ts` - Speeds, bounds, colors

### Step 4: Game State (Zustand)

- [x] Create `src/stores/gameStore.ts` - phase, score, lives, actions
- [x] Create `src/stores/playerStore.ts` - position state
- [x] Create `src/stores/enemyStore.ts` - enemy array CRUD
- [x] Create `src/stores/bulletStore.ts` - bullet array CRUD

### Step 5: Input System

- [x] Create `src/hooks/useKeyboard.ts` - tracks pressed keys via Set

### Step 6: Player Entity

- [x] Create `src/entities/Player.tsx`
  - White cube at Z=0
  - WASD/Arrow movement (X + Y axes with bounds)
  - Space to shoot (fire rate limited)
  - useFrame for per-frame updates

### Step 7: Star Field

- [x] Create `src/entities/Stars.tsx`
  - Points geometry with 800 stars
  - Stars stream toward camera (positive Z)
  - Reset to far Z when passing camera

### Step 8: Bullet System

- [x] Create `src/entities/Bullet.tsx` - moves along velocity, despawns at bounds
- [x] Create `src/entities/BulletManager.tsx` - renders all bullets from store

### Step 9: Enemy System

- [x] Create `src/entities/Enemy.tsx`
  - Blue cube, spawns at Z=-45
  - Phase 1: slow approach
  - Phase 2: fast attack when Z > -12
- [x] Create `src/entities/EnemyManager.tsx` - timed spawning, renders all enemies

### Step 10: Collision System

- [x] Create `src/systems/collisionSystem.ts`
  - Bullet → Enemy: remove both, add score
  - Enemy → Player: remove enemy, lose life
- [x] Create `src/game/GameLoop.tsx` - runs collision checks each frame

### Step 11: UI Overlays

- [x] Create `src/ui/HUD.tsx` - score + lives display
- [x] Create `src/ui/StartScreen.tsx` - title, controls, start button
- [x] Create `src/ui/GameOverScreen.tsx` - final score, restart button
- [x] Wire up in App.tsx based on game phase

### Step 12: Polish & Testing

- [x] Tune gameConfig values (speeds, spawn rate, bounds)
- [x] Test full game loop (start → play → die → game over → restart)

---

## Phase 2: Visual Polish (Future)

- [x] 3D ship models (GLTF)
- [ ] Mobile/touch controls
- [x] Upgrade star field to a more realistic one (round twinkling sprites, 2 parallax layers)
- [x] Custom shaders (explosions, propulsion effects)
- [x] Particle effects for hits/explosions
- [ ] Loading screen
- [ ] Game lobby/menu design
- [x] Sound effects (CC0, see public/sounds/ATTRIBUTION.md)
- [x] Background music
- [x] Screen shake on hits (trauma system wired; shake curve TODO in src/game/CameraRig.tsx)
- [x] Better background (CC0 nebula backdrop + bloom post-processing)
- [ ] Better UI/UX design
- [ ] Enemy 3d models (GLTF)

## Phase 3: Gameplay Depth (Future)

- [ ] Enemy shooting mechanics
- [ ] Power-ups (spread shot, shields)
- [ ] Wave-based spawning 
- [ ] Enemy formations and patterns
- [ ] Level progression (enemies come in waves starting at level 1 with few enemies more enemies added each level)
- [ ] Difficulty scaling
- [ ] High score system (localStorage)

---

## Controls

- **WASD / Arrow Keys:** Move ship (horizontal + vertical)
- **Spacebar:** Fire bullets

## Tech Stack

- React 19 + TypeScript + Vite
- @react-three/fiber (React renderer for Three.js)
- @react-three/drei (R3F utilities)
- Zustand (state management)

## File Structure

``` bash
src/
├── App.tsx                 # Main app with game + UI layers
├── index.css               # Global styles, HUD, menus
├── game/
│   ├── Game.tsx            # R3F Canvas setup
│   ├── Scene.tsx           # Lighting, fog, background
│   └── GameLoop.tsx        # Collision system coordinator
├── entities/
│   ├── Player.tsx          # Player movement + shooting
│   ├── Enemy.tsx           # Enemy behavior (approach → attack)
│   ├── EnemyManager.tsx    # Enemy spawning
│   ├── Bullet.tsx          # Bullet movement
│   ├── BulletManager.tsx   # Bullet rendering
│   └── Stars.tsx           # Streaming star field
├── stores/
│   ├── gameStore.ts        # Game phase, score, lives
│   ├── playerStore.ts      # Player position
│   ├── enemyStore.ts       # Enemy array management
│   └── bulletStore.ts      # Bullet array management
├── systems/
│   └── collisionSystem.ts  # AABB collision detection
├── hooks/
│   └── useKeyboard.ts      # Keyboard input tracking
├── types/
│   └── game.types.ts       # TypeScript type definitions
├── constants/
│   └── gameConfig.ts       # All tunable game values
└── ui/
    ├── HUD.tsx             # Score + lives display
    ├── StartScreen.tsx     # Start menu
    └── GameOverScreen.tsx  # Game over screen
```

## Key Patterns Used

1. **useFrame game loop** - Frame-rate independent movement with delta time
2. **Zustand stores** - Granular subscriptions, access outside React via getState()
3. **useRef for meshes** - Direct manipulation without re-renders
4. **Entity-Manager pattern** - Manager renders array, Entity handles behavior
5. **AABB collision** - Simple box intersection for hit detection
