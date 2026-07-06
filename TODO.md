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

## Phase 2: Production Polish - COMPLETE!

- [x] 3D ship models (GLTF)
- [x] Mobile/touch controls (adaptive play area, joystick + fire + pause overlay)
- [x] Upgrade star field to a more realistic one (round twinkling sprites, 2 parallax layers)
- [x] Custom shaders (explosions, propulsion effects)
- [x] Particle effects for hits/explosions
- [x] Loading screen (asset progress bar with fade-out)
- [x] Game lobby/menu design (cinematic menu: live ship idle + camera drift)
- [x] Sound effects (CC0, see public/sounds/ATTRIBUTION.md)
- [x] Background music
- [x] Screen shake on hits (trauma system wired; shake curve TODO in src/game/CameraRig.tsx)
- [x] Better background (CC0 nebula backdrop + bloom post-processing)
- [x] Better UI/UX design (invuln blink, damage flash, low-lives vignette, score pop + floaters)
- [x] Enemy 3d models (GLTF) (Space Invaders models; spawn mix TODO in src/stores/enemyStore.ts)
- [x] Audio settings (music/SFX volume + mute, persisted)
- [x] Fullscreen on mobile game start (+ home-screen standalone metas for iPhone)

## Phase 3: Deployment & Hardening (Next)

- [ ] Host on a real URL (Vercel/Netlify/S3 - decide)
- [ ] Code-split the 1.35 MB bundle (three.js/postprocessing chunks)
- [ ] Bundle the drei Environment HDR locally (currently fetched from an external CDN at runtime)
- [ ] Error boundary around the Canvas + favicon/meta/social tags
- [ ] PWA manifest (icon, name, display: standalone)

## Phase 4: Gameplay Depth (Future)

- [ ] Enemy shooting mechanics
- [ ] Power-ups (spread shot, shields)
- [ ] Wave-based spawning
- [ ] Enemy formations and patterns
- [ ] Level progression (enemies come in waves starting at level 1 with few enemies more enemies added each level)
- [ ] Difficulty scaling
- [ ] High score system (localStorage)

---

Controls, tech stack, and project structure live in [README.md](README.md); architecture notes for AI-assisted development live in [CLAUDE.md](CLAUDE.md).
