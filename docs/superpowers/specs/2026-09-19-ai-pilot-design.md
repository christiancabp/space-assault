# AI Pilot — Design Spec

- **Date:** 2026-09-19
- **Status:** Approved for planning
- **Author:** Chris + Claude
- **Feature:** Real-time TypeSafe (Jev) autopilot that plays Space Assault

## 1. Summary

Add a toggleable **AI Pilot** that plays the game in real time using TypeSafe's
System One model (Jev). While engaged, the ship moves, fires, and dodges on its
own; the human can reclaim control instantly. Each "tick" the pilot sends a small
snapshot of the game as a readable 2D plane to a serverless proxy, which asks Jev
four parallel typed questions and returns a decision the game executes every frame
until the next decision arrives.

The pilot has two behavioral modes decided by Jev each tick:

- **Attack** (default): hunt invaders — line up under a target and fire.
- **Evade** (last resort): barrel-roll to phase through an imminent collision.

## 2. Goals / Non-goals

**Goals**
- Full autopilot toggle during a normal game (move + fire + dodge).
- Real-time feel: self-clocked decision loop (~100 ms/query per TypeSafe docs).
- Attack-first behavior; evade only when a hit is imminent.
- Readable 2D-plane state (plain x/y coords, proximity rating), so the model —
  and a human reading logs — can reason about it easily.
- Secret API key stays server-side (Vercel function in this repo).
- A HUD readout that shows the live typed judgments ("watch Jev think").

**Non-goals**
- No training/fine-tuning; we use Jev as-is via the API.
- No attempt to be an optimal player; the goal is a compelling, legible real-time demo.
- No per-frame inference (impossible over the network; not needed).
- No new gameplay mechanics — the pilot uses only existing controls
  (move, fire, barrel-roll).

## 3. Threat model (confirmed from code)

- Enemies **do not fire bullets.** `collisionSystem.ts` damages the player only on
  **enemy-ship collision** (`checkCollisions`, enemy-player loop); the sole bullet
  factory is `createPlayerBullet` and enemy-owned bullets are skipped for damage.
- Therefore the only danger is an invader colliding with the ship. `incomingFire`
  is **not** part of the state snapshot.
- Enemy phases: `approaching` (slow) → `attacking` (fast dive past
  `ENEMY_ATTACK_TRIGGER_Z`). "Diving" = `phase === 'attacking'`.
- To **kill** an invader, the ship's `x`/`y` must line up with the invader's `x`/`y`,
  because player bullets travel straight along −Z from the ship. Aiming ≈ matching
  the target's x/y.
- A **barrel roll grants invincibility** (`isBarrelRolling` → invulnerable in
  `collisionSystem`), so evade = barrel roll = i-frames through the collision.

## 4. Architecture

```
Player.tsx (60 fps) ──reads──▶ aiInput { moveX, moveY, firing, dodge }
                                    ▲ writes
AiPilotController (self-clocked loop, only while enabled && phase==='playing')
   1. buildPilotState()  ← reads player / enemy / playArea stores via getState()
   2. requestDecision()  ── POST /api/pilot { state } (same-origin) ──▶ Vercel fn
   3. map answers → aiInput                                              │ + secret key
                                                                         ▼
                                            TypeSafe POST /v1/systemone  (~100 ms)
```

### New files

- `src/ai/aiInput.ts` — module-level mutable input object (mirrors `touchInput`):
  ```ts
  export const aiInput = { moveX: 0, moveY: 0, firing: false, dodge: false };
  export function resetAiInput(): void { /* zero all fields */ }
  ```
- `src/ai/pilotState.ts` — `buildPilotState(): PilotState` pure function; reads
  stores and returns the compact snapshot (see §6). Pure and unit-testable.
- `src/ai/pilotClient.ts` — `requestDecision(state, signal): Promise<PilotDecision>`;
  `fetch('/api/pilot', { method:'POST', body, signal })`; parses the typed answers.
- `src/ai/pilotMapping.ts` — `mapDecisionToInput(decision): void`; pure composition
  of typed answers → `aiInput` fields (attack/evade logic, thresholds). Unit-testable.
- `src/ai/AiPilotController.tsx` — headless component mounted in `Scene`; runs the
  loop in an effect; owns the `AbortController`, in-flight guard, failure handling.
- `api/pilot.ts` — **Vercel serverless function**; owns the TypeSafe question
  definitions and calls the SDK with the server-side key.

### Edited files

- `src/entities/Player.tsx` — when `aiPilotEnabled`, drive movement/fire/dodge from
  `aiInput` instead of keyboard/touch; add an imperative dodge trigger.
- `src/stores/gameStore.ts` — add `aiPilotEnabled: boolean` + `setAiPilot(v)` /
  `toggleAiPilot()`; default `false`; force `false` in `startGame`/`resetGame`.
- `src/ui/HUD.tsx` — "AI PILOT" badge + toggle button + live judgment readout.
- `src/config/gameConfig.ts` — new `AI_PILOT` config block (thresholds, timeout, caps).
- `src/game/Scene.tsx` (or wherever entities mount) — mount `<AiPilotController />`.
- `package.json` — add `@typesafe-ai/sdk` dependency.
- `.env.example` / Vercel env — document `TYPESAFE_API_KEY`.

## 5. Decision loop

- **Self-clocked, single-flight:** issue one request; on resolve, map it into
  `aiInput` and immediately issue the next. Never more than one in flight — this
  paces the loop to the round-trip (~3–6 Hz) while the ship executes the last
  decision every frame.
- **Runs only** while `aiPilotEnabled && phase === 'playing'`. Stops on toggle-off,
  pause, game-over, unmount, and `document.hidden` (visibilitychange).
- **Cancellation:** an `AbortController` aborts the in-flight request when the loop
  stops; `resetAiInput()` is called so the ship coasts to neutral.

## 6. The TypeSafe request

### State snapshot (readable 2D plane)

```json
{
  "ship":      { "x": -1.2, "y": 0.8 },
  "playfield": { "x": [-6, 6], "y": [-3, 4] },
  "invaders": [
    { "x": 0.9,  "y": 1.2, "z": 8.0,  "distance": 8.1, "diving": true  },
    { "x": -3.4, "y": 0.1, "z": 14.2, "distance": 14.8, "diving": false }
  ]
}
```

- Absolute game coordinates (no relative math) — a legible plane.
- `invaders` sorted **nearest-first** by `distance` to the ship; capped at
  `AI_PILOT.maxInvaders` (default 6) to keep the payload small (docs: "only
  relevant context").
- `distance` is the proximity rating; `diving` = `phase === 'attacking'`.
- Empty `invaders` is valid (the mapping treats it as "hold and don't fire").

### Questions (defined server-side, all over the same state, one parallel call)

- `mode` — **Choice** `{ attack, evade }`
  - instructions: "Should the ship press the attack, or evade? Choose **evade only
    as a last resort** — when a diving invader is about to collide with the ship
    (very close in x/y and z). Otherwise choose attack."
- `aim_horizontal` — **Choice** `{ left, center, right }`
  - instructions: "To line up a shot on the nearest invader, which way should the
    ship move horizontally? Bullets fire straight ahead, so match the target's x.
    `center` if already aligned."
- `aim_vertical` — **Choice** `{ up, center, down }`
  - instructions: "…to match the nearest invader's y. `center` if aligned."
- `fire` — **Noul**
  - instructions: "Is an invader lined up ahead right now, so firing would hit it?"

Each question gets concrete `criteria` (docs stress this). Model: `jev-latest`.

### Example response (shape we consume)

```json
{
  "answers": {
    "mode":           { "choice": "attack", "probabilities": {"attack":0.88,"evade":0.12}, "confidence": 0.76 },
    "aim_horizontal": { "choice": "right",  "probabilities": {"left":0.05,"center":0.15,"right":0.80}, "confidence": 0.72 },
    "aim_vertical":   { "choice": "center", "confidence": 0.4 },
    "fire":           { "noul": 0.66, "confidence": 0.66 }
  }
}
```

## 7. Answer → input mapping (`pilotMapping.ts`)

```
if mode.choice === 'evade' AND mode.confidence >= AI_PILOT.evadeConfidence:
    aiInput.dodge  = true                     # Player triggers barrel roll (i-frames)
    aiInput.moveX  = escapeDir                # away from nearest diving invader (code-derived)
    aiInput.moveY  = 0
    aiInput.firing = false
else:  # attack
    aiInput.moveX  = confGate(aim_horizontal) # {left:-1, center:0, right:1}, else 0 if conf < moveConfidence
    aiInput.moveY  = confGate(aim_vertical)   # {up:+1, center:0, down:-1}
    aiInput.firing = fire.noul > AI_PILOT.fireThreshold
    aiInput.dodge  = false
```

- `escapeDir` is computed in code from the nearest diving invader's x vs ship x and
  the playfield bounds (roll toward the more open side) — not asked of the model.
- Confidence gating avoids jitter on coin-flip movement decisions.
- Between decisions the previous `aiInput` persists (the loop only overwrites on a
  new decision), giving continuous motion.

## 8. Player integration

In `Player.tsx` `useFrame`, read `useGameStore.getState().aiPilotEnabled` (same
`getState()`-in-frame pattern already used for `PLAYER_BOUNDS`):

- **AI on:** `inputX/inputY/firing` come from `aiInput`; keyboard/touch movement is
  ignored. If `aiInput.dodge && !barrelRoll.active`, start a barrel roll with
  direction `sign(aiInput.moveX) || 1`, then set `aiInput.dodge = false` (consume).
- **AI off:** existing keyboard + touch logic unchanged (including human double-tap
  barrel roll).

The existing `PLAYER_FIRE_RATE` still governs actual shot cadence; `aiInput.firing`
just holds the trigger.

## 9. Toggle & HUD

- **Toggle key:** `P` ("Pilot"), plus an on-screen HUD button. A keydown listener
  toggles `aiPilotEnabled`.
- **Instant take-over:** while AI is on, any `isMovementKey()` keydown calls
  `setAiPilot(false)` so the human seamlessly resumes.
- **HUD:** an "AI PILOT" badge when active, showing the latest decision, e.g.
  `MODE attack · → right 0.80 · ↑ center · fire ✓` with confidences. This doubles as
  the "watch it think" demo. Uses a lightweight store/ref updated by the controller.

## 10. Vercel function & key handling

- `api/pilot.ts` runs on Vercel's Node runtime (Node 20+ for the SDK). It:
  1. Validates the POSTed `state`.
  2. Builds the four questions (§6) and calls TypeSafe via `@typesafe-ai/sdk`
     using `TYPESAFE_API_KEY` from `process.env` (never sent to the browser).
  3. Returns `{ answers }` (or a 502 with a safe error message).
- **Local dev:** `TYPESAFE_API_KEY` in `.env.local`, run with `vercel dev` so
  `/api/pilot` is served alongside the Vite app. (Plan step: confirm/add a
  `vercel dev` workflow; document it in README/CLAUDE.md.)
- **Prod:** set `TYPESAFE_API_KEY` in Vercel project env; deploys with `git push`.

## 11. Config additions (`GAME_CONFIG.AI_PILOT`)

| Key | Default | Meaning |
|---|---|---|
| `fireThreshold` | `0.5` | `fire.noul` above this → hold trigger |
| `moveConfidence` | `0.55` | below this on an aim Choice → treat as `center` |
| `evadeConfidence` | `0.6` | below this on `mode=evade` → stay in attack |
| `maxInvaders` | `6` | cap on invaders sent in the snapshot |
| `requestTimeoutMs` | `1000` | abort a tick that exceeds this |
| `maxConsecutiveFailures` | `5` | after this many, auto-disable + toast |

(All tunable; values are starting points to validate on real play, per TypeSafe's
guidance to test thresholds against your own data.)

## 12. Error handling & performance

- **Timeout:** `AbortController` per tick (`requestTimeoutMs`). Timed-out/failed tick
  → keep last `aiInput`; after `maxConsecutiveFailures`, `setAiPilot(false)` and show
  a HUD toast ("AI Pilot disconnected").
- **Bad/empty response:** fall back to neutral (`resetAiInput()`), don't crash.
- **Cost/rate:** one parallel request per tick (four questions, no extra latency);
  only while engaged + playing; paused when tab hidden. Log `usage` tokens in dev.
- **429/529:** brief backoff before the next tick (per docs).

## 13. Testing strategy

- **Unit (pure, no network):**
  - `buildPilotState` — nearest-first sort, `maxInvaders` cap, `diving` flag,
    empty-invaders case, coordinate correctness.
  - `mapDecisionToInput` — attack vs evade branch, confidence gating, fire threshold,
    `escapeDir` selection, previous-decision persistence.
- **Function:** `api/pilot.ts` with a mocked TypeSafe client — asserts request shape
  (state + four questions) and that the key comes from env, not the body.
- **Manual (Chrome DevTools MCP):** engage AI mid-game; confirm the ship hunts and
  dodges; confirm `/api/pilot` network calls; confirm a movement key returns control.
  Note: the automation browser caps rAF at 30 fps — do not trust FPS numbers there.

## 14. Rollout / deploy notes

- Add `TYPESAFE_API_KEY` to Vercel before the feature ships, or the toggle no-ops in
  prod (handled gracefully by §12).
- Update `README.md`, `CLAUDE.md`, and the in-game CREDITS/attribution if we surface
  TypeSafe there.

## 15. Open questions / assumptions to resolve in planning

- Confirm the exact mount point for `<AiPilotController />` (`Scene.tsx` vs `Game`).
- Confirm `vercel dev` is available locally (or document install) for `/api` testing.
- Confirm `@typesafe-ai/sdk` runs cleanly on Vercel's Node runtime; else fall back to
  a raw `fetch` to `https://api.typesafe.ai/v1/systemone` inside the function.
- Decide whether the HUD readout is always-on while engaged or dev-only.

## 16. Out of scope

- Difficulty scaling, multiple AI "personalities", or leaderboard for AI runs.
- Mobile-specific AI toggle placement (desktop-first; HUD button still works on touch).
- Any change to enemy spawning or scoring.
