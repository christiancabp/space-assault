# Design: Menus & UX (Phase 2, Milestone 2)

**Date:** 2026-07-06
**Status:** Approved (not committed — user commits)

## Goal

Production-feel app shell and gameplay feedback: loading screen, cinematic main menu, four HUD feedback systems, and 3D invader enemy models (user-provided GLBs) replacing the blue cubes.

## Components

| Unit | Purpose |
|------|---------|
| `ui/LoadingScreen.tsx` | Overlay gated on drei `useProgress`; progress bar + %, ~0.5s min display to avoid flash |
| `entities/MenuShip.tsx` | Selected ship idling in the live scene during `menu` phase (bob + slow yaw, engine flames) — replaces the static snapshot |
| `game/CameraRig.tsx` (extend) | Menu mode: slow Lissajous drift around a menu pose; eased transition to gameplay pose on start; shake only while playing |
| `ui/StartScreen.tsx` (rework) | Transparent center showing the 3D ship; breathing title glow; controls/audio panels tightened |
| Invulnerability blink | `Player.tsx` strobes ship visibility ~8Hz while `isInvulnerable` |
| `ui/DamageFlash.tsx` | Red radial flash ~300ms on life lost (re-keyed CSS animation); persistent subtle vignette + pulsing LIVES readout at 1 life |
| Score pop + floaters | Score readout scales/glows on change; `effects/ScoreFloaterManager.tsx` renders drifting `+100` drei `<Html>` floaters at kill positions via `effectsStore` (Entity-Manager pattern) |
| `config/enemyConfigs.ts` | Per-invader transform/hitbox/explosion-tint (mirrors `shipConfigs.ts`); models: invader_1, invader_3, invader_5, boss_invader from `public/models/invaders/` |
| `src/invaders/*.tsx` | gltfjsx-generated components per invader GLB |
| `entities/Enemy.tsx` (extend) | Renders the configured invader model (cube fallback if missing); enemy gets an `invaderType` chosen at spawn |

New `UI` section in `gameConfig.ts`: blink rate, flash duration, floater lifetime/rise, menu camera drift amplitude/speed.

**User contribution (learning mode):** `pickInvaderType()` in the spawn path — which invader model each spawn uses (uniform, weighted, score-based…) is a gameplay-flavor decision left to Chris with a guided TODO + working fallback.

## Error handling

- Missing/renamed GLB → cube fallback (never crashes spawn).
- Loading screen has no timeout dependency; if an asset fails, drei progress still settles and the menu appears.

## Verification

Lint + build; in-browser: loading bar on hard reload, menu ship idle + camera drift, start transition, invuln blink + damage flash + vignette on hits, score pop + floaters on kills, invader models rendering per type. No commits.
