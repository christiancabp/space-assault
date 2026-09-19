# Space Assault

A 3D space shooter built with React Three Fiber. Galaga-style gameplay — pick a ship, blast waves of classic Space Invaders, survive the dive attacks.

Plays on desktop (keyboard) and phones/tablets (touch controls, adaptive play area).

## Play

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. To play on your phone during development, run `npm run dev -- --host` and open your machine's LAN IP.

## Controls

### Keyboard

| Key | Action |
| --- | ------ |
| W A S D / Arrow keys | Move ship |
| Space | Fire |
| Double-tap Left/Right | Barrel roll (invincible dodge) |
| Enter | Start / Pause / Resume / Restart |
| P | Toggle AI Pilot (TypeSafe autopilot) during play |

### Touch (phones & tablets)

| Control | Action |
| ------- | ------ |
| Joystick (bottom-right) | Move ship — double-flick left/right to barrel roll |
| FIRE button (bottom-left) | Hold to fire |
| ❚❚ button (top-right) | Pause |

Starting the game goes fullscreen on Android/iPad. On iPhone, use Safari's **Add to Home Screen** and launch from the icon for fullscreen play.

## Features

- 9 selectable ships (Milano, TIE Fighter, Planet Express, Starship, and more) with animated engine-flame shaders
- Classic Space Invaders as 3D enemy models (slow approach, then fast dive)
- Neon-arcade visuals: bloom post-processing, shader-based particle explosions, twinkling parallax star field, nebula backdrop
- Trauma-based screen shake, damage flash, invulnerability blink, score floaters, low-lives warning
- Sound effects and music with independent volume/mute controls (persisted)
- Cinematic main menu with the selected ship idling live in the scene
- Loading screen, pause/resume, score + lives HUD
- Adaptive play area: portrait phones get a tall, thin corridor — the ship never leaves the screen
- **AI Pilot (experimental):** press `P` to let a TypeSafe (Jev) model fly the ship in real time — it hunts invaders and barrel-rolls to dodge as a last resort, with a live HUD readout of its decisions

## AI Pilot (TypeSafe)

> **Hidden feature:** the AI pilot only appears at the **`/ai-pilot`** route (e.g. `localhost:5173/ai-pilot` or `space-assault.vercel.app/ai-pilot`). On any other path the game plays normally with no trace of it.

Press **P** in-game (or the on-screen **AI PILOT** button) to hand control to an AI pilot powered by [TypeSafe](https://typesafe.ai)'s Jev model. It hunts invaders, aims, and barrel-rolls to dodge — playing the game for you in real time.

> 📖 **Full deep-dive** (architecture, the TypeSafe request/response and how the decision maps to the game, grid-based target lock, and how we drove accuracy from ~50% to zero escapes): **[docs/AI_PILOT.md](docs/AI_PILOT.md)**.

### How it works

A small real-time control loop around Jev:

1. **The board is a matrix.** Enemies keep their spawn x/y and only fly toward you (in z), so from behind the ship it's a 2D grid where only the ship moves. The game bins the playfield into an 11×5 grid; each enemy's distance becomes an *imminence* score (1 = far, 9 = about to reach you). That grid is exactly what the model sees — and what the "AI VIEW" mini-map draws.
2. **The model decides strategy (~2×/sec).** One request asks Jev three typed questions over the grid: **attack or evade**, and **which way** to move (horizontal + vertical) toward the most urgent invader.
3. **Code lands the shot (every frame).** The model's left/right/up/down is coarse, so a per-frame *vernier* steers precisely onto the target invader's exact position once the ship is close — this is what makes it hit reliably instead of spraying near-misses.
4. **Always be shooting.** While engaged the ship holds the trigger down, just like a human leaving the fire button pressed.

The HUD shows the live decision and an **ENEMY** score (+10 per invader that escapes past you). When you die, the **Game Over** screen reports session stats: kills vs escapes, kill rate, decisions/sec, requests/sec, and time engaged.

### Run it locally

The pilot needs a TypeSafe API key, which must stay server-side. In local dev, `npm run dev` serves the `/api/pilot` endpoint via a Vite middleware — no extra tooling required:

```bash
cp .env.example .env.local        # then paste your TypeSafe key into .env.local
npm run dev                       # game + /api/pilot on http://localhost:5173
```

Then open <http://localhost:5173>, start a game, and press **P**.

> The key is read only by the dev server (and, in production, the serverless function) — it is never bundled into the browser. With no key in `.env.local`, the pilot button simply reports an error and normal play is unaffected.

### Deploy (production)

In production the endpoint is a Vercel serverless function (`api/pilot.ts`). Set `TYPESAFE_API_KEY` in the Vercel project's **Environment Variables**; it ships automatically with the app.

### Request budget

Deliberately conservative: off until you engage, one request in flight at a time, a minimum gap between requests (`minTickIntervalMs`, ~2/sec since the per-frame vernier handles fine aim), a runaway backstop (`maxRequestsPerEngage`), and auto-disable after repeated failures. It also stops on death, toggle-off, or the tab going hidden. All knobs live in `GAME_CONFIG.AI_PILOT`.

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **React Three Fiber** / **Drei** — React renderer for Three.js
- **@react-three/postprocessing** — bloom
- **Zustand** — state management (with `persist` for settings)
- **Web Audio API** — SFX/music buses (no audio library)

## Scripts

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Type-check and build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
node scripts/measure-glb.mjs [dir]  # Print GLB bounding boxes (for model configs)
```

## Project Structure

```text
src/
├── App.tsx           # Game + UI overlay orchestration
├── ai/               # AI pilot: state snapshot, decision mapping, client, controller
├── audio/            # Web Audio sound manager
├── config/           # gameConfig (tunables), shipConfigs, enemyConfigs
├── effects/          # Explosions, score floaters, engine flames (GLSL)
├── entities/         # Player, Enemy, Bullet, Stars, MenuShip
├── game/             # Canvas, Scene, GameLoop, CameraRig, PlayAreaManager, PostFX
├── hooks/            # Keyboard input
├── input/            # Touch input + fullscreen helper
├── invaders/         # Enemy model renderer
├── ships/            # Ship model renderer (config-driven)
├── shipSelector/     # Ship carousel
├── stores/           # Zustand stores (game, player, enemy, bullet, effects, settings, playArea)
├── systems/          # Collision detection
├── types/            # TypeScript definitions
└── ui/               # HUD, menus, loading screen, touch controls, audio settings

api/
├── _pilotCore.ts     # Shared TypeSafe questions + decision (fn + Vite dev middleware)
└── pilot.ts          # Vercel serverless function — TypeSafe proxy (keeps the key server-side)
```

## Tuning

All gameplay values live in `src/config/gameConfig.ts` — player/bullet/enemy speeds, spawn rates, explosion particles, screen-shake feel, audio defaults, bloom intensity, and UI feedback timings. Per-model transforms and hitboxes are in `shipConfigs.ts` (ships) and `enemyConfigs.ts` (invaders).

## Credits

All third-party assets are Creative Commons licensed and credited on the in-game CREDITS screen:

- **Ship models** — CC-BY-4.0 via Sketchfab, see [`public/models/ATTRIBUTION.md`](public/models/ATTRIBUTION.md)
- **Invader models** — CC-BY-4.0 by [nitwit.friends](https://sketchfab.com/nitwit.friends) and [alban](https://sketchfab.com/alban) (via Sketchfab), see `src/invaders/InvaderModel.tsx`
- **Sound effects & music** — CC0, see [`public/sounds/ATTRIBUTION.md`](public/sounds/ATTRIBUTION.md)
- **Nebula texture** — CC0 by Screaming Brain Studios, see [`public/textures/ATTRIBUTION.md`](public/textures/ATTRIBUTION.md)
- **Night HDRI** — CC0 by Greg Zaal (Poly Haven), see [`public/hdri/ATTRIBUTION.md`](public/hdri/ATTRIBUTION.md)
