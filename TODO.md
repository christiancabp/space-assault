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

## Phase 3: Deployment & Hardening - COMPLETE!

- [x] Host on a real URL (Vercel: https://space-assault.vercel.app/)
- [x] Compress ship GLBs 65 MB → 5.6 MB (gltf-transform: meshopt + WebP textures @1024;
      ship components rewritten to config-driven drei `<Clone>` — see ShipModel.tsx)
- [x] Lazy ship loading: only the persisted selection preloads at boot; other ships
      stream on demand in the selector
- [x] Code-split the bundle (react/three/r3f vendor chunks; game code is its own ~48 KB chunk)
- [x] Bundle the drei Environment HDR locally (public/hdri/night.hdr, CC0)
- [x] nebula.png → nebula.webp (1.3 MB → 86 KB)
- [x] Error boundary around the Canvas (SIGNAL LOST fallback + webglcontextlost)
      (recovery-strategy TODO in src/ui/CanvasErrorBoundary.tsx)
- [x] Favicon/meta/social tags (invader icon.svg + PNG sizes, OG/twitter tags)
- [x] PWA manifest (icons, display: standalone, portrait)
- [x] vercel.json immutable cache headers for /models /sounds /textures /hdri
- [x] In-game CREDITS screen attributing all models/audio/art
- [ ] Runtime perf refactors (deferred): per-frame store churn → mutable position
      registry; star streaming on the GPU (spec C7–C8 in
      docs/superpowers/specs/2026-07-06-deployment-perf-plan.md)

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
