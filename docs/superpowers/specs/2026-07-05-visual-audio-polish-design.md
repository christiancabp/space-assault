# Design: Visual & Audio Polish (Phase 2, Milestone 1)

**Date:** 2026-07-05
**Status:** Approved

## Goal

Take the working Phase 1 PoC to production-quality game feel: neon-arcade visuals with bloom, particle explosions, screen shake, an upgraded star field, a nebula background, and sound effects + music. First of four Phase 2 milestones (visual/audio → menus/UX → mobile/touch → deployment).

## Decisions

- **Art direction:** neon arcade with bloom post-processing (`@react-three/postprocessing`).
- **Effects architecture:** a new Zustand `effectsStore` following the existing Entity-Manager pattern. The collision system triggers effects with direct store calls, exactly as it already calls `removeEnemy()`/`addScore()`. No event bus, no external particle engine (YAGNI).
- **Audio:** plain Web Audio API (no dependency), CC0 assets (Kenney sci-fi packs) in `public/sounds/` with documented attribution. Audio failure is non-fatal — the game runs silent.

## Components

| Unit | Purpose | Interface |
|------|---------|-----------|
| `stores/effectsStore.ts` | Holds active explosions + screen-shake trauma | `spawnExplosion(position, color)`, `removeExplosion(id)`, `addTrauma(amount)`, `decayTrauma(delta)` |
| `effects/ExplosionManager.tsx` + `Explosion.tsx` | Renders pooled additive `Points` bursts per explosion; self-removes after lifetime | subscribes to `explosions` |
| `game/CameraRig.tsx` | Applies `trauma²`-scaled positional/roll noise around the base camera pose, decays trauma | reads `trauma` each frame |
| `audio/soundManager.ts` | Preloads/decodes buffers, plays SFX with pitch variance, loops/ducks music via gain buses | `play(name)`, `startMusic()`, `pauseMusic()`, `stopMusic()` |
| `entities/Stars.tsx` (rewrite) | Streaming star field with round soft sprites, depth-attenuated size, twinkle, two parallax layers | same mount point as today |
| `game/PostFX.tsx` | EffectComposer + Bloom, config-driven | mounted in Canvas |
| Nebula background | Subtle dark CC0 texture behind existing fog | set in `Scene.tsx` |

All tunables live in new `gameConfig.ts` sections: `EXPLOSIONS`, `SCREEN_SHAKE`, `AUDIO`, `BLOOM`, plus star-layer settings.

## Data flow

`collisionSystem.ts` (bullet→enemy, enemy→player) → `spawnExplosion` + `addTrauma` + `soundManager.play(...)`. Player fire → laser SFX. `gameStore` phase changes → music start/duck/stop. Same direct-store-call pattern used everywhere in the codebase.

## Error handling

- Audio: every decode/play wrapped; failures log a warning and no-op.
- Particles: fixed-size pooled buffers allocated once; explosion count naturally bounded by enemy count.
- Bloom: single quality setting in config; tuned down rather than branching per device (mobile milestone owns adaptive quality).

## Testing / verification

`npm run lint` + `npm run build`; in-browser full game loop (fire, kill, get hit, die, restart) checking explosions, shake, audio, bloom; FPS near 60 under load; game runs with audio assets deleted.
