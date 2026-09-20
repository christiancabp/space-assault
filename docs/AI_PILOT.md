# Can a remote AI judgment model play Space Invaders in real time?

*An experiment wiring [TypeSafe](https://typesafe.ai)'s **Jev** model into a React
Three Fiber shooter as a real-time autopilot — and what it took to go from
spray-and-miss to zero escapes.*

---

## The premise

We kept hearing that TypeSafe's **Jev** — a "System One" model that returns
*typed judgments* in ~100 ms instead of paragraphs of text — is fast. Fast enough
that people imagine it playing games like Doom in real time.

Space Assault is our Galaga-style shooter: fly a ship, blast waves of Space
Invaders before they dive into you. So we asked a simple question:

> **Can Jev fly the ship in real time — well enough to actually hunt invaders and
> not die?**

The catch that makes it interesting: Jev is a **remote** model. Every "thought"
is a network round trip, so you obviously can't call it 60 times a second. And it
doesn't run a trained game-playing policy — it *answers questions* you pose about
the current state. So the real question underneath is:

> **Can you build a real-time agent around a ~100 ms remote judgment call?**

Our bet going in: **yes — if the model makes the *decisions* and code handles the
*twitch*.**

## TL;DR — did it work?

**Yes.** On the hidden `/ai-pilot` route you press **P** and the ship flies
itself: hunting invaders, lining up shots, barrel-rolling out of danger. It lands
**~90%+ of its shots**, in practice lets **essentially zero invaders escape**,
runs at **~2 requests/second**, and is deployed in production.

But the *first* version missed about half its shots and wandered back to the
middle of the screen after every burst. The interesting part is the handful of
reframes that got us from there to here — and every accuracy win came from the
same move: **taking work away from the model and giving it to code.** Here's the
whole thing.

---

## How it works

### The big idea: decide at a cadence, execute every frame

A ~100 ms remote model can't drive a 60 fps game directly. It doesn't need to.
The pattern is:

> **Decide at a cadence, execute every frame.**

A few times a second we send the model a small, structured question about the
board; it returns a typed decision; the ship executes that decision on *every*
animation frame until the next one arrives.

```text
  model decision:  ●─────────500 ms─────────●─────────500 ms─────────●   (~2 / sec)
  frames @ 60fps:  ┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊   (~30 frames each)
                   └── the ship executes the LAST decision on every frame ──┘
```

The other load-bearing idea is the **division of labour**:

| Concern | Owner | Why |
| --- | --- | --- |
| Strategy — attack or evade, which way to head | **Model (Jev)** | "Programmable common sense" over a fuzzy board |
| Exact aiming, target lock, holding, firing | **Code** | Precise geometry is a *calculation*, not a judgment |

This mirrors TypeSafe's own guidance — *keep known calculations and control flow
in code; use the model only where you need semantic understanding.* Foreshadowing:
almost every accuracy win below came from moving a **calculation** out of the
model and into code.

### The board is a 2D matrix

The observation that unlocked everything: **the invaders never move in x/y.** They
keep their spawn column and only advance in **z** toward the player (`Enemy.tsx`
literally only ever does `position.z += speed * delta`). So, viewed from behind
the ship, the playfield is a **2D board where only the ship moves**, and each
invader is a fixed cell whose *urgency* grows as it approaches.

The one axis the invaders *do* travel — depth (z) — becomes an "imminence" score:

```text
  spawn (far)                                                   player plane
    z ≈ -45  ───────────  invader flies straight at you (+z)  ─────────▶  z ≈ 0
    (x and y never change) ─────────────────────────────────────────────
  imminence:  1 ····· 2 ····· 3 ····· 4 ····· 5 ····· 6 ····· 7 ····· 8 ····· 9
            (far, ignore)                                    (about to pass — kill it NOW)
```

`src/ai/grid.ts` bins the visible play area into an `11 × 5` grid, drops each
invader into its cell as an imminence **1–9**, and records the ship's own cell. A
moment of play becomes the grid below — which is *exactly* what the on-screen
**"AI VIEW"** mini-map draws. `.` is empty, `1`–`9` is an invader's imminence,
`▲` is you:

```text
   AI VIEW  ·  11 columns × 5 rows
   col →    0   1   2   3   4   5   6   7   8   9  10
          ┌──────────────────────────────────────────┐
   row 0  │ .   .   .   .   .   .   .   .   .   .   . │  ← top
   row 1  │ .   .   .   3   .   .   .   .   .   .   . │  a far invader (imminence 3)
   row 2  │ .   .   .   .   .   .   9   .   .   .   . │  ← URGENT invader (9!)
   row 3  │ .   .   .   .   ▲   .   .   .   .   .   . │  ← your ship
   row 4  │ .   .   .   .   .   .   .   .   .   .   . │  ← bottom
          └──────────────────────────────────────────┘
```

Colour-coded the way the mini-map paints it (green → amber → red as imminence rises):

```text
   ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛
   ⬛⬛⬛🟩⬛⬛⬛⬛⬛⬛⬛     🟩 low  (1–4)
   ⬛⬛⬛⬛⬛⬛🟥⬛⬛⬛⬛     🟨 mid  (5–7)
   ⬛⬛⬛⬛🔷⬛⬛⬛⬛⬛⬛     🟥 high (8–9)
   ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛     🔷 ship
```

Giving the model this labelled grid instead of a list of floating-point
coordinates was the single biggest accuracy jump (more on that below): a
*picture*, not a math problem.

### The request we send Jev

Each tick the browser POSTs the grid to our own `/api/pilot`, which forwards it
(with the secret key) to TypeSafe's HTTP API:

```http
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <TYPESAFE_API_KEY>
Content-Type: application/json
```

```jsonc
{
  "model": "jev-latest",
  "state": {                          // the grid snapshot
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

- **All three questions run in parallel in one request.** TypeSafe evaluates them
  independently over the same state — no latency penalty for asking several at
  once, and one answer can't secretly bias another.
- **The question wording is the behaviour lever.** The instructions/criteria in
  `api/pilot.ts` are where "what makes a good pilot" is expressed. (That
  `"row 0 is the TOP, so up means a smaller row number"` sentence? It fixed a real
  bug — see the findings.)

### The decision we get back

TypeSafe returns a **typed** answer per question — no text to parse:

```jsonc
{
  "answers": {
    "mode":           { "type": "choice", "choice": "attack",
                        "confidence": 0.97, "probabilities": { "attack": 0.97, "evade": 0.03 } },
    "aim_horizontal": { "type": "choice", "choice": "right", "confidence": 0.99, "probabilities": {…} },
    "aim_vertical":   { "type": "choice", "choice": "up",    "confidence": 1.0,  "probabilities": {…} }
  },
  "usage": { "input_tokens": ~1050, "output_tokens": ~120 }
}
```

Each **Choice** gives you the selected `choice`, a `confidence` (0–1), and the full
`probabilities` distribution. `/api/pilot` normalizes that into a compact object
the browser consumes directly:

```ts
interface PilotDecision {
  mode:          { choice: 'attack' | 'evade';          confidence: number };
  aimHorizontal: { choice: 'left' | 'center' | 'right'; confidence: number };
  aimVertical:   { choice: 'up' | 'center' | 'down';    confidence: number };
}
```

So "the decision" is **three typed enums with confidences.** No prompt-scraping,
no JSON-repair — just values your code can switch on.

### Mapping the decision to the controls

`decisionToInput()` turns the decision into the ship's control frame
`{ moveX, moveY, firing, dodge }`:

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

`confidence` doubles as a jitter gate (don't move on a coin-flip), firing is
always on ("always be shooting"), and evade fires the game's invincible
barrel-roll whose i-frames phase the ship *through* the incoming invader.

### Aiming: target lock + vernier + hold

The model's `left/center/right` is deliberately coarse — a grid cell is wider than
the ship's hitbox, so "in the right cell" ≠ "lined up to hit." Code closes that
gap, and crucially **commits to one target**:

```ts
// Player.tsx, every frame while engaged (paraphrased):
if (enemies.length === 0) {                 // nothing to chase → HOLD (do nothing)
  inputX = 0; inputY = 0; lockedTargetId = null;
} else {
  // LOCK onto one invader by id; keep it until it's destroyed.
  let target = enemies.find(e => e.id === lockedTargetId)
            ?? enemies.reduce((a, b) => b.z > a.z ? b : a);   // else lock the most urgent
  lockedTargetId = target.id;

  const dx = target.x - ship.x, dy = target.y - ship.y;
  if (Math.hypot(dx, dy) < vernierRange) {  // close enough → fine-steer to EXACT x/y
    inputX = Math.abs(dx) < holdDeadzone ? 0 : clamp(dx / vernierGain, -1, 1);
    inputY = Math.abs(dy) < holdDeadzone ? 0 : clamp(dy / vernierGain, -1, 1);
  }
}
```

- **Target lock** — pick the most-urgent invader and stick with it *by id* until
  it's destroyed, instead of re-choosing every frame.
- **Proportional vernier** — within range, steer to the invader's *exact* x/y,
  decelerating as it closes, so it settles instead of overshooting.
- **Hold deadzone** — once lined up, move *nothing* and let the steady fire
  connect. (With no invaders at all, hold position instead of drifting.)

```text
  WITHOUT lock  (thrash)                 WITH lock + hold
  two invaders at similar depth:         commit to one, hold, then relock:

    [A]       [B]                           [A]       [B]
       ↖     ↗    ship darts A→B→A→…            │        locks A, holds under it,
         [▲]      through the middle            [▲]      fires a steady stream → hit,
      miss · drift · retry                              then relocks B
```

### The rest, briefly

- **Hidden feature** — the whole thing (UI + hotkey) only exists on the
  `/ai-pilot` route; elsewhere the controller isn't even mounted, so no requests
  are possible.
- **Live telemetry** — an "AI PILOT · LIVE" stats panel, a scrolling decision log,
  and an "ENEMY" escape KPI, all on the HUD; a full recap on Game Over.
- **Server key handling** — `api/pilot.ts` is a self-contained serverless proxy
  (native `fetch`, no SDK) so `TYPESAFE_API_KEY` never touches the browser.
- **Budget & safety** — off by default, one request in flight (self-clocked), a
  throttle, a runaway cap, auto-disable on repeated failures, and it stops on
  death / toggle / tab-hidden.

---

## The journey: from ~50% to zero escapes

Every step here came from *watching it play* and translating the behaviour into
code. The kill rate climbed in four distinct jumps:

```text
  kill rate     ~50%             ~70–90%          ~90%              ~100% / 0 escapes
                ▇▇▇▇▇            ▇▇▇▇▇▇▇          ▇▇▇▇▇▇▇▇▇         ▇▇▇▇▇▇▇▇▇▇▇▇
  milestone     v1: raw floats   + 2D grid        + vernier          + target lock
                (spray & miss)   (model reads     (code does         (commit + hold
                                  the board)       exact aim)         → nothing escapes)
```

1. **Real-time = decide-at-cadence + execute-every-frame.** The foundational bet
   held: a ~100 ms network model deciding a few times a second, with the ship
   executing the last decision every frame, genuinely *feels* real-time.

2. **Representation beats prompting.** The first version sent a list of raw float
   coordinates and asked the model to compare them. It sometimes flew *down* when
   the target was *up* — LLMs are shaky at ad-hoc float arithmetic. Switching to
   the **labelled 2D grid** plus one sentence (*"row 0 is the TOP…"*) fixed the
   spatial reasoning outright. Give the model a picture, not a math problem.

3. **Watch out for overshoot.** At full speed, a decision every ~1.5 s flung the
   ship wall-to-wall. Fix: slow the ship under AI and decide more often — small
   corrections, not lurches.

4. **Always-be-shooting.** We originally asked a fourth question, "should I fire?"
   It hovered around 5% and the ship barely shot. A human just *holds the
   trigger*, so we deleted the question and made firing always-on — which improved
   hits **and** cut the request from four questions to three. Quality *and* cost,
   same change.

5. **Precision is a calculation — put it in code.** Even with good directions, a
   cell is wider than the hitbox, so the ship sprayed near-misses. The
   **proportional vernier** (steer to the invader's exact x/y in code) took it
   from ~50% to ~90%. The model chooses *what/where*; code lands the shot.

6. **Commit, don't thrash.** The vernier still re-picked "closest" every frame, so
   two invaders at similar depth made the ship oscillate through the middle — the
   *get-close → drift-back → retry* wobble a player would immediately spot. A
   **target lock** (stick with one invader until it dies) plus a **hold deadzone**
   (do nothing once aligned) removed it entirely — and that's when escapes hit
   zero. *Greedy per-frame "optimality" produced worse behaviour than committed
   hysteresis.*

7. **The model's real job is judgment, not twitch.** By the end, Jev decides only
   the strategic layer — attack vs evade, roughly which way — while code owns
   exact aim, target lock, holding, and firing. More accurate *and* cheaper, and
   exactly the System One philosophy: code owns the loop; the model supplies
   common sense where geometry alone isn't enough.

---

## Debugging war story: the prod-only crash

Everything worked locally, but in production `/api/pilot` returned
**500 FUNCTION_INVOCATION_FAILED** on every call. We wasted time guessing (SDK
version? Node version?) before pulling the actual Vercel log:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/api/_pilotCore'
  imported from /var/task/api/pilot.js
```

The repo is `"type": "module"`, so Vercel runs the function as **native ESM**,
where relative imports need file extensions and `_`-prefixed helper files aren't
even shipped — so `import { decidePilot } from './_pilotCore'` failed to resolve
at load, crashing before any handler code ran (that's why even a GET 500'd). Fix:
make the function fully self-contained (no relative imports) and drop the SDK for
a plain `fetch`. **Lesson: when local ≠ prod, get the real logs early instead of
reasoning from the outside.**

---

## So… did it work?

**The hypothesis held.** You *can* build a genuinely real-time game agent around a
remote ~100 ms judgment model — as long as the model does judgment and code does
the reflexes. The finished pilot hunts, aims, holds, and dodges convincingly at
~90%+ accuracy with essentially no escapes, on ~2 requests/second.

The honest nuances:

- **It's not a trained game-playing policy.** Jev never "learned Space Invaders."
  Each tick we *ask it questions* about a board and it answers with calibrated,
  typed choices. That's the appeal: no training loop, no model to host — just
  well-posed questions and code around them.
- **The model got *simpler* as the pilot got *better*.** We started asking it to
  do precise aiming and ended up asking it almost nothing but "attack or evade,
  and roughly which way." Counterintuitively, that made it both more accurate and
  cheaper. The skill was in deciding *what* to ask.
- **"Real-time" is an architecture, not a latency number.** 100 ms per call would
  be hopeless if you tried to gate every frame on it. Decide-at-cadence +
  execute-every-frame makes it feel instant.

If you want the one-liner: **the model's superpower here isn't speed or
smarts — it's returning typed judgments your code can build a control loop
around.**

---

## What's next

The pilot is good, but there's clear headroom. The full backlog (with
effort/trade-off notes) lives in [`TODO.md`](../TODO.md); the high-leverage ones:

- **Cost — stop calling the model when code already knows what to do.** Steady
  aiming is 100% code now, so switch from a fixed ~2/sec timer to **event-driven
  decisions** (only on a spawn, a kill, a broken lock, or a mode flip). This is a
  far bigger win than trimming tokens — most ticks could make *zero* requests.
- **Accuracy — break the lock on an imminent escape.** Target-lock's one weakness
  is over-committing while another invader slips by; switching when a *different*
  invader hits imminence 9 would close the last gaps.
- **Measurement — an eval harness.** Log each decision and its outcome
  (kill/escape) so we can compare configs and question wordings *quantitatively*
  instead of by eye — turning tuning from vibes into data.
- **Reliability — a pure-code fallback pilot** for when the API is slow or down,
  so it keeps playing.

And one thing we deliberately *won't* build: predictive/lead aim. The invaders
never move in x/y, so there's nothing to lead.

---

## Try it

Open the game, go to the **`/ai-pilot`** route, start a game, and press **P**.
Watch the mini-map (what the model sees), the decision log (what it's deciding),
and the ENEMY counter (how many it lets slip — spoiler: none).

---

## Appendix: tuning knobs (`GAME_CONFIG.AI_PILOT`)

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
