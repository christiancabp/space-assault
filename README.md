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
