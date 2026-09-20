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
npm run dev      # Start dev server with HMR + local /api/pilot middleware (localhost:5173)
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
├── ai/                     # AI pilot (TypeSafe/Jev): aiInput, pilotState, pilotMapping,
│                           # pilotClient, AiPilotController (self-clocked decision loop)
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
├── ships/                  # ShipModel (config-driven, drei <Clone>, boot-preloads selected ship)
├── shipSelector/           # Ship carousel + preview canvas
├── stores/                 # Zustand: game, player, enemy, bullet, effects (explosions/floaters/
│                           # trauma), settings (persisted audio prefs), playArea (live bounds),
│                           # aiPilot (autopilot enabled/status/last decision)
├── systems/                # collisionSystem (also triggers explosion/shake/SFX feedback)
├── types/                  # game.types.ts, ship.types.ts
└── ui/                     # HUD, menus, LoadingScreen, DamageFlash, TouchControls,
                            # AudioSettings, CreditsScreen, CanvasErrorBoundary

public/
├── models/                 # Ship GLBs, compressed (+ models/invaders/; see ATTRIBUTION.md)
├── sounds/                 # CC0 SFX + music (see ATTRIBUTION.md)
├── textures/               # CC0 nebula backdrop (see ATTRIBUTION.md)
├── hdri/                   # night.hdr - self-hosted drei "night" preset (CC0)
├── icon.svg + *.png        # Favicon / PWA / apple-touch icons
└── manifest.webmanifest    # PWA manifest (standalone, portrait)

api/
├── _pilotCore.ts           # Shared TypeSafe questions + decision (used by the fn AND Vite dev middleware)
└── pilot.ts                # Vercel serverless fn — TypeSafe proxy (keeps TYPESAFE_API_KEY server-side)
```

### 3D Models

GLB model files are in `public/models/` and loaded at runtime. Both ships and invaders are rendered config-driven via drei `<Clone object={scene}>`: `src/ships/ShipModel.tsx` reads `shipConfigs.ts` (`modelPath`, transform, hitbox, engine mounts), `src/invaders/InvaderModel.tsx` reads `enemyConfigs.ts`. There are NO per-ship gltfjsx components anymore — `<Clone>` renders the file's own node hierarchy, which survives GLB recompression (gltfjsx-baked JSX does not: quantization rewrites node transforms and the baked transforms go stale).

The 9 ship GLBs (rocketship, guardians-ship, planet-express, rick-n-morty, sayan-capsule, space-shuttle, starship, tie-fighter, time-machine) are compressed with `@gltf-transform/cli optimize --compress meshopt --texture-compress webp --texture-size 1024 --simplify false` (65 MB → 5.6 MB). drei's `useGLTF` wires the meshopt decoder by default — no app code needed. Two caveats learned the hard way:

- Config transforms in `shipConfigs.ts` are tuned against the *rendered* pose. tie-fighter and rocketship originals had root matrices that the old hand-tuned components ignored; their roots were normalized (scale-only / identity) before compression so `<Clone>` matches the tuned configs. If you re-derive from the original Sketchfab downloads, re-apply that normalization (see git history of `public/models/`).
- Only the persisted selected ship is preloaded at boot (`ShipModel.tsx` module scope); the rest stream on demand behind the ship-selector's Suspense. Keep it that way — preloading all ships was the 65 MB first-load bug.

Enemy models live in `public/models/invaders/` (invader_1/3/5, boss_invader — classic Space Invaders sprites, 64 KB total, left uncompressed); per-type transforms/hitboxes/explosion tints are in `src/config/enemyConfigs.ts`.

All models are CC-BY-4.0 (see `public/models/ATTRIBUTION.md` and the in-game CREDITS screen — update both when models change). `scripts/measure-glb.mjs [dir]` prints bounding boxes/centers for tuning configs (raw accessor min/max — NOT meaningful on quantized GLBs; use `npx @gltf-transform/cli inspect` for those). `scripts/check-glb-names.mjs [dir|file]` dumps node/material name sets.

### Key Patterns

1. **useFrame for game loop** - All entity updates use `useFrame` with delta time for frame-rate independent movement
2. **Zustand outside React** - Collision system uses `getState()` to access stores without subscriptions
3. **useRef for meshes** - Direct mesh manipulation in useFrame avoids re-renders
4. **Entity-Manager pattern** - Manager subscribes to array, Entity handles its own behavior (also used for explosions and score floaters)
5. **Layered rendering** - R3F Canvas always renders; HTML UI overlays conditionally based on game phase
6. **Direct store calls, no event bus** - collisionSystem triggers feedback (spawnExplosion, addTrauma, playSfx) the same way it removes entities
7. **Module-level mutable input** - keyboard Set and touchInput object are read in useFrame without re-renders; Player merges both (stick deflection >0.6 = digital press, so double-tap logic covers double-flick). The AI pilot adds a third source, `aiInput` (src/ai/aiInput.ts); when engaged Player reads it instead of keyboard/touch
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

## AI Pilot (TypeSafe / Jev)

A toggleable autopilot that plays the game in real time using TypeSafe's Jev model. Off by default; press **P** (or the HUD button) during play to engage; any movement key or a second press hands control back.

> **Full deep-dive (request/response, decision mapping, grid target-lock, findings): [`docs/AI_PILOT.md`](docs/AI_PILOT.md).** The summary below is the quick reference.

**Hidden feature:** the pilot's UI (button, mini-map, readout) and the P hotkey only appear when the app is opened at the **`/ai-pilot`** route — gated by `AI_PILOT_UNLOCKED` in `src/ai/featureFlag.ts` (pathname ends with `/ai-pilot`). `vercel.json` has an SPA rewrite (`/((?!api/).*) → /index.html`) so that path serves the app in prod. Everywhere else the game shows no trace of it and the controller isn't even mounted (so P is inert and no requests are possible).

- **Flow:** `AiPilotController` (headless, mounted in `App` *outside* the Canvas, only on `/ai-pilot`) runs a self-clocked, single-flight loop while engaged and `phase==='playing'`: `buildPilotState()` → POST `/api/pilot` → `decisionToInput()` writes the module-level `aiInput` (mirrors `touchInput`); `Player` executes `aiInput` every frame. Cadence is **event-driven**: a new request fires only when the front target changes or an invader starts diving (plus an adaptive safety refresh), one in flight, capped at ~2/sec — so most ticks make no request (~0.8/sec typical).
- **State (the "matrix"):** `src/ai/grid.ts` bins the playfield into a 2D grid (`AI_PILOT.gridCols×gridRows`, default 11×5). Enemies keep their spawn x/y and only advance in z (see `Enemy.tsx`), so each is a *fixed cell*; its z becomes an *imminence* 1–9 (9 = about to reach/pass the ship). The snapshot sent to Jev is just `{ grid, dims, ship }`. The same grid renders live as the "AI VIEW" mini-map (`src/ui/MiniMap.tsx`, top-right, desktop only).
- **Decision:** one parallel request asks Jev three Choice questions — `mode` (attack/evade), `aim_horizontal`, `aim_vertical` — reading the grid + ship cell. Code composes them: attack = move toward the most-urgent cell; evade (last resort) = barrel-roll dodge whose i-frames phase through the collision. Question wording lives in `api/pilot.ts` and is the **main behavior lever**.
- **Aim (vernier + target lock):** the model's L/C/R directions are coarse (a cell is wider than the hitbox), so `Player` runs a **fine-align vernier** every frame: within `AI_PILOT.vernierRange` of its target it steers to that invader's *exact* x/y with proportional (decelerating) control (`vernierGain`) and **holds** (moves nothing) once inside `holdDeadzone`. Crucially it **locks onto one invader by id until that invader is destroyed** rather than re-picking the closest each frame — otherwise two similar-distance invaders make the ship flip-flop through the middle (get-close → drift-back → retry). With no invaders it holds position instead of coasting on a stale decision. The model picks the approach; code locks, lands the shot, and holds. This took the kill rate from ~50% to ~90%+.
- **Firing (ABS):** always-be-shooting — the ship holds the trigger the whole time it's engaged (decided in code, not the model). Threat model: enemies never shoot; the only danger is a diving invader colliding.
- **Server function:** `api/pilot.ts` is **self-contained** (questions + native `fetch` to `https://api.typesafe.ai/v1/systemone` + handler; no SDK, no relative imports) and also exports `decidePilot`, which the Vite dev middleware (`vite.config.ts`) reuses so **`npm run dev` serves `/api/pilot` with no `vercel dev`**. `TYPESAFE_API_KEY` is read server-side only: `.env.local` (gitignored) locally, Vercel project env in prod.
  - **Gotcha (cost a long debug):** repo is `"type": "module"`, so Vercel runs the function as **native ESM** — extensionless relative imports fail with `ERR_MODULE_NOT_FOUND` and `_`-prefixed helpers aren't shipped. Keep the function self-contained (no relative imports). `package.json` pins `engines.node` to `22.x`.
- **KPIs / stats:** every invader that leaks past the ship awards the enemy +10 (`gameStore.enemyScore`, hooked at `Enemy.tsx`'s despawn), shown in the HUD as "ENEMY". Per-game pilot stats live in `aiPilotStore` (`requests`/`decisions`/`engagedMs`, plus `engageStartedAt` for live engaged-time; reset each game by the controller). They surface **live** — an "AI PILOT · LIVE" panel under the score (`src/ui/AiStats.tsx`; desktop always, mobile behind a 📊 icon via `isTouchDevice`) and again on the **Game Over "AI PILOT — SESSION STATS"** panel: kills vs escapes, kill rate, decisions/sec, requests/sec, total decisions, time engaged. The top-center readout is a **scrolling decision log** (`aiPilotStore.decisionLog`, newest-first, capped): 2 rows, hover expands to 5, scroll for the whole session, clears on reset. `src/ai/trace.ts` logs spawn/kill/escape to the console in dev (`AI_PILOT.trace`).
- **Request budget:** conservative by default — off until engaged, one request in flight, **event-driven cadence** (`pollIntervalMs` checks; decide on target-change/dive + `activeRefreshMs`/`idleRefreshMs` adaptive refresh) under a `minTickIntervalMs` ~2/sec ceiling → ~0.8/sec typical, a `maxEngageMs` ~60s per-engagement cap, `maxRequestsPerEngage` runaway backstop, auto-disable after `maxConsecutiveFailures`. All in `GAME_CONFIG.AI_PILOT`. The pure `buildPilotState`/`decisionToInput`/`buildGrid` are isolated for unit testing (no test runner configured yet).

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

**Keyboard:** WASD/Arrows move · Space fires · double-tap Left/Right barrel-rolls (invincible dodge) · Enter starts/pauses/resumes/restarts · **P** toggles the AI pilot — but only on the hidden `/ai-pilot` route (`/api/pilot` is served in dev by a Vite middleware, so plain `npm run dev` works)

**Touch** (coarse-pointer devices only, during gameplay): joystick bottom-right (double-flick = barrel roll) · hold-to-fire bottom-left · pause top-right. START GAME requests fullscreen on mobile (iPhone Safari lacks the API - standalone home-screen launch is its fullscreen path).

## Asset Sourcing

CC0 audio/textures came from OpenGameArt (direct file URLs work with curl; kenney.nl's downloads are JS-gated). Keep the attribution files in `public/models/`, `public/sounds/`, `public/textures/`, `public/hdri/` AND the in-game CREDITS screen (`src/ui/CreditsScreen.tsx`) updated when adding assets. Don't assume GLB node structure is uniform across files — both `ShipModel` and `InvaderModel` use drei `<Clone object={scene}>` for that reason.

## Deployment (Vercel)

Live at <https://space-assault.vercel.app/>; push-to-main deploys prod. `vercel.json` sets `Cache-Control: immutable, max-age=1y` on `/models`, `/sounds`, `/textures`, `/hdri`. These paths are NOT content-hashed — when replacing an asset, RENAME the file (e.g. `nebula2.webp`), or returning visitors keep the stale cached copy for a year. Vite-hashed JS/CSS and index.html use Vercel defaults and are safe.

The AI pilot's endpoint is a serverless function at `api/pilot.ts` (sharing `api/_pilotCore.ts`). Set `TYPESAFE_API_KEY` in the Vercel project's Environment Variables (server-side only) for it to work in prod. Locally, `npm run dev` serves `/api/pilot` via a Vite dev middleware, so no `vercel dev` is required.
