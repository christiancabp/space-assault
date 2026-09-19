# AI Pilot — How it works (deep dive)

An experiment: can a **System One** model ([TypeSafe](https://typesafe.ai)'s **Jev**)
play Space Assault in real time — well enough to actually hunt invaders and not
die? Short answer: yes. Press **P** on the hidden `/ai-pilot` route and the ship
flies itself, hitting ~90%+ of invaders with essentially zero escapes.

This document explains the whole system end to end, and logs what we learned
tuning it from a spray-and-miss ~50% up to near-perfect.

---

## 1. The big idea: a real-time control loop around a judgment model

Jev is a *remote* model that returns **typed judgments** (not free text) in
~100 ms. You can't call it at 60 fps, and you don't need to. The pattern is:

> **Decide at a cadence, execute every frame.**

A few times a second we ask the model a small, structured question about the
current board; it returns a typed decision; the ship executes that decision on
every animation frame until the next one arrives.

The other key idea is the **division of labour**:

| Concern | Owner | Why |
| --- | --- | --- |
| Strategy — attack or evade, which way to head | **Model (Jev)** | "Programmable common sense" over a fuzzy board |
| Exact aiming, target lock, holding, firing | **Code** | Precise geometry is a *calculation*, not a judgment |

This mirrors TypeSafe's own guidance — *keep known calculations and control flow
in code; use the model only where you need semantic understanding.* Almost every
accuracy win in this project came from moving a **calculation** out of the model
and into code.

---

## 2. Architecture at a glance

```
Player.tsx (60 fps) ── reads ──▶ aiInput { moveX, moveY, firing, dodge }
                                      ▲ writes (per decision)
AiPilotController (self-clocked loop, only while engaged & phase==='playing')
   1. buildPilotState()   ← reads player / enemy / playArea stores  (src/ai/pilotState.ts)
   2. POST /api/pilot { state }            ── same-origin ──▶  Vercel fn (api/pilot.ts)
   3. decisionToInput(decision, state)      writes aiInput          │ + secret key
                                                                    ▼
                                       TypeSafe  POST /v1/systemone  (~100 ms)
```

Files:

| File | Role |
| --- | --- |
| `src/ai/grid.ts` | Bins the playfield into the 2D "matrix" (`buildGrid`) |
| `src/ai/pilotState.ts` | `buildPilotState()` → the snapshot sent to the model |
| `src/ai/pilotMapping.ts` | `decisionToInput()` → typed decision → `{moveX,moveY,firing,dodge}` |
| `src/ai/pilotClient.ts` | `requestDecision()` → one POST to `/api/pilot` |
| `src/ai/AiPilotController.tsx` | The self-clocked loop, hotkeys, stats, reset |
| `src/ai/aiInput.ts` | Module-level mutable control state (mirrors `touchInput`) |
| `src/entities/Player.tsx` | Executes `aiInput` each frame; **target lock + vernier + hold** |
| `api/pilot.ts` | Self-contained serverless proxy → TypeSafe HTTP API |
| `src/ui/AiStats.tsx`, `src/ui/MiniMap.tsx` | Live HUD telemetry |
| `src/ai/featureFlag.ts` | Gates the whole feature behind the `/ai-pilot` route |

---

## 3. The "matrix" — representing the board as a 2D grid

The crucial observation: **in this game the enemies never move in x/y.** They
keep their spawn column and only advance in **z** toward the player (`Enemy.tsx`
only ever does `position.z += speed * delta`). So, viewed from behind the ship,
the playfield is a **2D board where only the ship moves** and each invader is a
fixed cell whose *urgency* grows as it approaches.

`src/ai/grid.ts` turns the live game into that board:

- Bin the visible play area into `gridCols × gridRows` cells (default **11 × 5**).
- Drop each invader into its cell.
- Its `z` becomes an **imminence** score **1–9** (1 = just spawned/far, 9 = about
  to reach and pass the ship).
- Record the ship's own cell.

```ts
// GridModel
{ cols: 11, rows: 5,
  cells: number[][],           // rows top(0)->bottom; 0 = empty, 1..9 = imminence
  ship: { col, row } }
```

An LLM reads this far more reliably than a list of floating-point coordinates
(see Findings #2). It's also exactly what the **"AI VIEW" mini-map** draws, so
you literally see what the model sees.

---

## 4. Talking to TypeSafe — the request

Each tick the browser POSTs the snapshot to our own `/api/pilot`, which forwards
it (with the secret key) to TypeSafe's HTTP API:

```http
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <TYPESAFE_API_KEY>
Content-Type: application/json
```

```jsonc
{
  "model": "jev-latest",
  "state": {                          // the grid snapshot from §3
    "grid": [
      [0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,3,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,9,0,0,0,0],        // a very urgent invader (9) at row 2, col 6
      [0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0]
    ],
    "dims": { "cols": 11, "rows": 5 },
    "ship": { "col": 4, "row": 4 }
  },
  "questions": {                      // three Choice questions, asked in parallel
    "mode":          { "type": "choice", "instructions": "...attack or evade...",
                       "criteria": { "attack": "...", "evade": "..." } },
    "aim_horizontal":{ "type": "choice", "instructions": "...move toward the most urgent enemy's column...",
                       "criteria": { "left": "...", "center": "...", "right": "..." } },
    "aim_vertical":  { "type": "choice", "instructions": "...row 0 is the TOP...",
                       "criteria": { "up": "...", "center": "...", "down": "..." } }
  }
}
```

Two things worth calling out:

- **All three questions run in parallel in one request** — TypeSafe evaluates
  them independently over the same state, so there's no latency penalty for
  asking several at once, and one answer can't secretly bias another.
- **The question wording is the behaviour lever.** The instructions/criteria in
  `api/pilot.ts` are where "what makes a good pilot" is expressed. (Note the
  explicit *"row 0 is the TOP, so moving up means a smaller row number"* — that
  one sentence fixed a real bug; Findings #2.)

---

## 5. The decision — the response and its type

TypeSafe returns a typed answer per question. Raw:

```jsonc
{
  "model": "jev-latest",
  "answers": {
    "mode":           { "type": "choice", "choice": "attack",
                        "confidence": 0.97, "probabilities": { "attack": 0.97, "evade": 0.03 } },
    "aim_horizontal": { "type": "choice", "choice": "right", "confidence": 0.99, "probabilities": {…} },
    "aim_vertical":   { "type": "choice", "choice": "up",    "confidence": 1.0,  "probabilities": {…} }
  },
  "usage": { "input_tokens": ~1050, "output_tokens": ~120 }
}
```

Each **Choice** answer gives you three things:

- `choice` — the selected option (`"attack"`, `"left"`, `"up"`, …)
- `confidence` — 0–1, how concentrated the probability mass is
- `probabilities` — the full distribution over the options

`/api/pilot` normalizes this to a compact `PilotDecision` (`src/ai/types.ts`),
which is what the browser receives:

```ts
interface PilotDecision {
  mode:          { choice: 'attack' | 'evade';         confidence: number };
  aimHorizontal: { choice: 'left' | 'center' | 'right'; confidence: number };
  aimVertical:   { choice: 'up' | 'center' | 'down';    confidence: number };
}
```

So the "decision" is **three typed enums with confidences** — code can consume
that directly, no parsing, no prompt-scraping.

---

## 6. Mapping the decision to the game

`decisionToInput()` (`src/ai/pilotMapping.ts`) turns the decision into the ship's
control frame `{ moveX, moveY, firing, dodge }`:

```ts
// Evade only as a last resort, and only when the model is confident:
if (mode.choice === 'evade' && mode.confidence >= evadeConfidence) {
  return { moveX: escapeDir, moveY: 0, firing: true, dodge: true }; // barrel-roll dodge
}

// Otherwise attack: coarse aim from the Choices, gated by confidence:
const moveX = aimHorizontal.confidence >= moveConfidence ? {left:-1,center:0,right:1}[…] : 0;
const moveY = aimVertical.confidence   >= moveConfidence ? {up:+1,center:0,down:-1}[…]   : 0;
return { moveX, moveY, firing: true, dodge: false };  // firing is ALWAYS on (ABS)
```

- **Confidence gates movement** so the ship doesn't jitter on a coin-flip.
- **Firing is always on** ("always be shooting", Findings #4).
- **Evade** triggers the existing invincible barrel-roll; its i-frames phase the
  ship *through* the incoming invader (enemies never shoot, so a collision is the
  only threat).

`Player.tsx` reads `aiInput` every frame — the *coarse* move above drives the
**approach**, and then the **vernier + target lock** (next section) takes over the
**precise** aim.

---

## 7. Aiming: target lock + proportional vernier + hold

The model's `left/center/right` is coarse — a grid cell is wider than the ship's
hitbox, so "in the right cell" ≠ "lined up to hit." Code closes that gap, and
critically **commits to one target**:

```ts
// Player.tsx, every frame while engaged (paraphrased):
const enemies = useEnemyStore.getState().enemies;

if (enemies.length === 0) {                 // nothing to chase → HOLD (do nothing)
  inputX = 0; inputY = 0; lockedTargetId = null;
} else {
  // LOCK onto one invader by id; keep it until it's destroyed.
  let target = enemies.find(e => e.id === lockedTargetId)
            ?? enemies.reduce((a, b) => b.z > a.z ? b : a);   // else lock the most urgent (highest z)
  lockedTargetId = target.id;

  const dx = target.x - ship.x, dy = target.y - ship.y;
  if (Math.hypot(dx, dy) < vernierRange) {  // close enough → fine-steer to EXACT x/y
    inputX = Math.abs(dx) < holdDeadzone ? 0 : clamp(dx / vernierGain, -1, 1);
    inputY = Math.abs(dy) < holdDeadzone ? 0 : clamp(dy / vernierGain, -1, 1);
  }
}
```

Three behaviours, each of which measurably improved play:

1. **Target lock** — the pilot picks the most-urgent invader (highest `z`) and
   sticks with it *by id* until that invader is destroyed, instead of re-choosing
   every frame. Without this, two invaders at similar depth make "closest" flip
   back and forth and the ship darts between their columns — the classic
   *get-close → drift-back → retry* thrash.
2. **Proportional vernier** — within `vernierRange` it steers to the target's
   **exact** x/y, decelerating as it closes (`dx / vernierGain`), so it settles
   instead of overshooting.
3. **Hold deadzone** — once within `holdDeadzone` of the target it moves
   **nothing** and just lets the always-on fire connect. (And with no invaders at
   all, it holds position rather than coasting on a stale decision.)

Net: the ship locks a target, glides onto its exact column, holds, and the steady
ABS stream destroys it — then it relocks the next one.

---

## 8. The rest of the system (brief)

- **Hidden feature** — the UI (button, mini-map, stats, decision log) and the P
  hotkey only exist on the **`/ai-pilot`** route (`src/ai/featureFlag.ts`); a
  `vercel.json` SPA rewrite serves that path in prod. Elsewhere the game shows no
  trace and the controller isn't even mounted, so no requests are possible.
- **Live telemetry** — an "AI PILOT · LIVE" stats panel (kills/escapes, kill rate,
  decisions/sec, requests/sec, engaged time; behind a 📊 icon on mobile), a
  scrolling **decision log** (newest-first, 2 rows, hover→5), and an **ENEMY**
  escape score in the HUD. Same numbers recap on Game Over.
- **Server key handling** — `api/pilot.ts` is **self-contained** (questions +
  native `fetch` + handler, no SDK, no relative imports) and reads
  `TYPESAFE_API_KEY` server-side only; the Vite dev middleware reuses its exported
  `decidePilot` so `npm run dev` serves `/api/pilot` with no `vercel dev`.
- **Budget & safety** — off by default, one request in flight (self-clocked),
  `minTickIntervalMs` throttle (~2/sec), `maxRequestsPerEngage` runaway backstop,
  auto-disable after `maxConsecutiveFailures`, and it stops on death / toggle /
  tab-hidden.

---

## 9. Interesting findings

How the pilot went from missing half its shots to letting *nothing* escape. Each
step came from watching it play and translating the behaviour into code.

**Kill rate over the experiment: ~50% → ~90% → ~zero escapes.**

1. **Real-time = decide-at-cadence + execute-every-frame.** A ~100 ms network
   model can't drive 60 fps directly, but it doesn't need to. Deciding a few
   times a second and executing the last decision every frame *feels* real-time.

2. **Representation beats prompting.** The first version sent a list of raw float
   coordinates and asked the model to compare them. It sometimes moved *down*
   when the target was *up* — LLMs are shaky at ad-hoc float arithmetic. Switching
   to a **labelled 2D grid** plus one explicit sentence (*"row 0 is the TOP, so up
   is a smaller row number"*) fixed the spatial reasoning. Give the model a
   *picture*, not a math problem.

3. **Overshoot from the throttle.** At full move speed, a decision every ~1.5 s
   sent the ship wall-to-wall (a whole arena width per decision). Fix: **slow the
   ship under AI** (`aiSpeedScale`) and **decide more often** — small corrections,
   not lurches.

4. **Always-be-shooting.** We originally asked a fourth question, "should I fire?"
   — it hovered around 5% and the ship barely shot. Realising a human just *holds
   the trigger*, we deleted the question and made firing always-on. That improved
   hits **and** dropped the request from 4 questions to 3 (cheaper). A rare change
   that helped quality and cost at once.

5. **Precision is a calculation — put it in code.** Even with good directions, a
   grid cell is wider than the hitbox, so the ship sprayed near-misses. The
   **proportional vernier** (steer to the invader's exact x/y in code) took the
   kill rate from ~50% to ~90%. The model chooses *what/where*; code lands the
   shot.

6. **Commit, don't thrash.** The vernier still re-picked "closest" every frame,
   so two similar-distance invaders made the ship oscillate through the middle
   (*get-close → drift-back → retry*). Adding a **target lock** (stick with one
   invader by id until it dies) plus a **hold deadzone** (do nothing once aligned)
   removed the oscillation entirely — and that's when escapes went to zero.
   *Lesson: greedy per-frame "optimality" produced worse behaviour than committed
   hysteresis.*

7. **The model's real job is judgment, not twitch.** By the end, Jev decides only
   the strategic layer — **attack vs evade**, and roughly **which way** — while
   code owns exact aim, target lock, holding, and firing. That split is both more
   accurate and cheaper, and it's exactly the System One philosophy: code owns the
   loop; the model supplies common sense where geometry alone isn't enough.

8. **Typed output is the unlock.** Getting back `{choice, confidence}` enums
   instead of text meant zero parsing and trivial, testable composition
   (`decisionToInput` is a pure function). Confidence doubled as a jitter gate.

---

## 10. Debugging war story: the prod-only crash

Everything worked locally but `/api/pilot` returned **500 FUNCTION_INVOCATION_FAILED**
on every call in production. We chased the wrong things first (SDK version, Node
version) before getting the actual Vercel log:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/api/_pilotCore'
  imported from /var/task/api/pilot.js
```

Root cause: the repo is `"type": "module"`, so Vercel runs the function as
**native ESM**, where relative imports need file extensions and `_`-prefixed
helper files aren't shipped — so `import { decidePilot } from './_pilotCore'`
failed to resolve at load, crashing before any handler code ran (hence even a GET
500'd). Fix: make the function **fully self-contained** (no relative imports) and
drop the SDK for a plain `fetch`. *Lesson: when local ≠ prod, get the real logs
early instead of reasoning from the outside.*

---

## 11. Tuning knobs (`GAME_CONFIG.AI_PILOT`)

| Key | Default | What it does |
| --- | --- | --- |
| `toggleKey` | `KeyP` | Keyboard toggle |
| `gridCols` / `gridRows` | `11` / `5` | Grid resolution the model sees |
| `minTickIntervalMs` | `500` | Min gap between requests (~2/sec) |
| `aiSpeedScale` | `0.5` | Ship speed under AI (finer aim) |
| `vernierRange` | `4` | Distance at which code takes over exact aim |
| `vernierGain` | `2` | Proportional gain (smaller = snappier) |
| `holdDeadzone` | `0.5` | Within this of the target → hold, do nothing |
| `moveConfidence` | `0.55` | Below this on an aim Choice → hold (center) |
| `evadeConfidence` | `0.6` | Below this on `mode=evade` → keep attacking |
| `requestTimeoutMs` | `1000` | Abort a slow tick |
| `maxRequestsPerEngage` | `1000` | Runaway backstop (~5 min) |
| `maxConsecutiveFailures` | `5` | Auto-disable after repeated failures |
| `trace` | `true` | Log spawn/kill/escape to the console (dev only) |

The question wording in `api/pilot.ts` is the other, larger lever.
