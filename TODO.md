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

## Phase 5: AI Pilot (TypeSafe / Jev) - SHIPPED

Real-time autopilot that plays the game via TypeSafe's Jev model. Full writeup in
[docs/AI_PILOT.md](docs/AI_PILOT.md).

- [x] Hidden behind the `/ai-pilot` route (`src/ai/featureFlag.ts` + `vercel.json` SPA rewrite)
- [x] 2D "matrix" grid state (`src/ai/grid.ts`, 11×5, imminence 1-9) + live "AI VIEW" mini-map
- [x] Event-driven decision loop - decide on target-change/dive + adaptive refresh, ~2/sec ceiling (`src/ai/AiPilotController.tsx`)
- [x] Three parallel Choice questions - `mode` / `aim_horizontal` / `aim_vertical` (`api/pilot.ts`)
- [x] Self-contained serverless proxy via native `fetch` (no SDK); Vite dev middleware reuses `decidePilot`
- [x] Always-be-shooting (fire in code, not a model question)
- [x] Fine-align vernier + **target lock** + hold deadzone (`src/entities/Player.tsx`) → ~90%+, near-zero escapes
- [x] Evade = invincible barrel-roll dodge (i-frames through the collision)
- [x] Live HUD: stats panel (desktop / 📊 on mobile), scrolling decision log, ENEMY escape KPI
- [x] Game Over session stats; per-game reset
- [x] Budget guards: off by default, **event-driven** cadence (~0.8/sec typical, ~2/sec ceiling), runaway cap, auto-disable on repeated failures

## AI Pilot - Future Improvements

Ideas for cutting API cost, sharpening accuracy, and hardening the loop. Not yet
built. Effort = S/M/L. "Speculative" = unproven, worth a spike first.

**Quick wins (do these first):**

- [ ] Trim the request payload (S)
- [x] Event-driven cadence - decide on change, not a timer (~60% fewer calls). _Next:_ skip the model entirely in steady-state; trim tokens
- [ ] Break lock on an imminent escape (S-M) - biggest remaining accuracy gap
- [ ] Pure-code fallback pilot when the API is down/slow (M) - reliability

### API cost (fewer / cheaper requests)

- [x] ✅ **Event-driven / adaptive cadence (SHIPPED).** The model is asked only on
      meaningful change (front target killed/replaced, an invader diving) plus an
      adaptive safety refresh (`activeRefreshMs` while diving / `idleRefreshMs`
      when calm), under a `minTickIntervalMs` ~2/sec ceiling. Cut typical usage
      from ~2/sec to **~0.8/sec (~60%)** with no accuracy loss. Follow-ups below
      (skip-in-steady-state, token trim) can go further.
- [ ] **Skip the model when code is confident.** The lock + vernier fully handle
      "keep hunting the locked target." Only consult Jev to (a) choose a *new*
      target after a kill, or (b) decide attack↔evade. Between those, don't call.
      _Why:_ collapses most ticks to zero requests. _Effort:_ M. _Trade-off:_ the
      readout/decision-log updates less often (they'd tick only on real decisions).
- [ ] **Shrink input tokens (~1050 in/req today).** Shorten the `instructions`/
      `criteria` strings in `api/pilot.ts`; cap how many invaders the grid encodes
      (only the top few by imminence); consider a coarser grid when the board is
      sparse. _Effort:_ S. _Trade-off:_ over-trimming instructions can hurt the
      model's spatial reasoning - re-measure kill rate after.
- [ ] **Drop unused response fields.** We only read `choice` + `confidence`;
      `probabilities` is ignored. If the API supports omitting it, do so.
      _Effort:_ S. _Trade-off:_ none if supported; otherwise no-op.
- [ ] **Dedupe identical consecutive grids.** If this tick's grid == last tick's,
      reuse the last decision instead of re-requesting. _Effort:_ S. _Trade-off:_
      grids rarely repeat exactly while enemies advance in z; pairs well with a
      coarser grid or event-driven cadence.
- [ ] **One combined question vs three (measure).** Try a single richer question
      returning mode+direction vs the current three parallel Choices. _Effort:_ S
      to try. _Trade-off:_ Speculative - parallel Choices are already one request;
      may not help tokens/latency. Measure before committing.
- [ ] **Back off harder when safe.** When no invader is within N cells, widen the
      interval further (or pause requests). _Effort:_ S. Overlaps with
      event-driven cadence.

### Accuracy / play quality

- [ ] **Break lock on imminent escape.** If a *different* invader reaches
      imminence 9 (about to leak past) while locked on a lower-priority target,
      switch to it. _Why:_ the one weakness of target-lock is over-committing while
      another slips by - this closes the last escapes. _Effort:_ S-M (code-only, in
      `Player.tsx`'s lock logic). _Trade-off:_ too-eager switching reintroduces
      thrash; only break for a genuinely-escaping higher-urgency target.
- [ ] **Smarter target prioritization.** Rank threats by `imminence + column
      distance` (cheap to reach + about to escape) instead of pure max-z. Or use
      TypeSafe's **Score** primitive to rank per-invader threat. _Effort:_ M
      (code heuristic) / L (Score). _Trade-off:_ Score adds request cost; a code
      heuristic is free - try that first.
- [ ] **Independent evade safety-net.** A pure-code proximity check (or a **Noul**
      "is a collision imminent?") that can trigger the barrel-roll dodge even if
      the `mode` Choice says attack. _Why:_ decouples "don't die" from the model's
      strategic call; more robust. _Effort:_ S (code) / M (Noul). _Trade-off:_ Noul
      adds a question; code check is free and deterministic - prefer it.
- [ ] **Boss-invader handling.** If bosses have more health/bigger hitboxes, keep
      the lock longer and confirm the kill before relocking. _Effort:_ S-M.
- [ ] **Do NOT build predictive/lead aim.** Enemies never change x/y (only z), so
      there's nothing to lead - the target's column is fixed. Noted here so nobody
      spends time on it.
- [ ] **A/B question-wording harness.** The instructions/criteria are the main
      behavior lever; make it easy to swap wordings and compare kill/escape rates
      over N runs. _Effort:_ M. Pairs with the eval harness below.

### Performance / reliability

- [ ] **Pure-code fallback pilot.** If `/api/pilot` is unavailable or slow, keep
      flying with a code-only policy (lock nearest by z + vernier + ABS; dodge on
      proximity). _Why:_ the game stays fun/playable with zero model calls; also a
      useful baseline (see below). _Effort:_ M. _Trade-off:_ loses the "AI decides"
      framing while degraded - show a HUD note.
- [ ] **Reduce HUD churn.** `AiStats` recomputes on a 250ms timer and the decision
      log re-renders per decision; consider refs/`useSyncExternalStore` selectors
      or a canvas mini-map if profiling shows cost. _Effort:_ S-M. _Trade-off:_
      likely negligible today - measure first, don't pre-optimize.
- [ ] **Tune timeouts + retry/backoff.** `requestTimeoutMs` (1000) vs the server
      `fetch` timeout (5000) aren't aligned; add explicit 429/5xx backoff in
      `pilotClient`/`api`. _Effort:_ S. _Trade-off:_ none.
- [ ] **Remove/keep the `trace` flag intentionally.** `AI_PILOT.trace` is dev-only
      (gated by `import.meta.env.DEV`) but still labeled TEMP - decide to keep as a
      debug switch or delete. _Effort:_ S.

### Bigger bets / unknown-unknowns (speculative)

- [ ] **Decision + outcome eval harness.** Log each decision with the resulting
      outcome (hit/miss/escape/kill) and replay offline to score a config or a
      question-wording change on kill-rate/escape-rate. _Why:_ turns tuning from
      "watch it play" into data. Per TypeSafe's docs these labeled signals can even
      become classical-ML features. _Effort:_ L. _Trade-off:_ real infra; highest
      long-term payoff for accuracy work.
- [ ] **Confidence-routing.** Act only when `confidence` clears a threshold;
      otherwise fall back to the code policy (or hold). _Why:_ uses TypeSafe's
      second axis (the answer says *what*, confidence says *whether to trust it*).
      _Effort:_ M. _Trade-off:_ needs the code fallback to exist first.
- [ ] **Self-play difficulty finder.** Let the AI's live kill/escape rate scale the
      spawn rate up until it starts losing - auto-discovers its breaking point and
      makes a fun "watch it sweat" mode. _Effort:_ M. Speculative but cheap to try.
- [ ] **Model vs pure-code baseline.** Run the code-only pilot and the Jev pilot
      under identical spawns and compare kill/escape rates - quantifies exactly
      what the model adds. _Effort:_ M (needs the fallback + harness).
- [ ] **Leaderboard for AI runs** (score + escapes + kill rate), separate from
      human high scores. _Effort:_ M. Depends on a backend/store.

---

Controls, tech stack, and project structure live in [README.md](README.md); architecture notes for AI-assisted development live in [CLAUDE.md](CLAUDE.md).
