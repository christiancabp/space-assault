# Design: Mobile & Touch (Phase 2, Milestone 3)

**Date:** 2026-07-06
**Status:** Approved (not committed — user commits)

## Goal

Playable on phones/tablets in any orientation. Portrait phone = tall, thin play area; the ship can never leave the screen. On-screen controls: fixed joystick (bottom-right), hold-to-fire button (bottom-left), pause button (top-right). Barrel roll via joystick double-flick. Controls visible only on coarse-pointer (touch) devices.

## Components

| Unit | Purpose |
| ---- | ------- |
| `stores/playAreaStore.ts` | Holds the current play bounds {minX,maxX,minY,maxY}; defaults to `PLAYER_BOUNDS` |
| `game/PlayAreaManager.tsx` | On viewport resize, unprojects screen corners through the *base* gameplay camera pose onto the z=0 player plane; writes `min(frustum rect − ship margin, designed bounds)` to the store. Uses a virtual camera so menu drift/shake never jitters bounds |
| `input/touchInput.ts` | Module-level mutable `{ moveX, moveY, firing }` (zero-re-render, same pattern as useKeyboard) |
| `entities/Player.tsx` (extend) | Merges keyboard + touch: analog input sums, stick deflection >0.6 counts as digital left/right so existing double-tap barrel-roll logic handles double-flick unmodified; clamps to playAreaStore bounds |
| `stores/enemyStore.ts` (extend) | Spawn X/Y ranges clamped to play bounds so enemies always arrive on-screen |
| `ui/TouchControls.tsx` | Joystick (pointer capture, radius clamp, 0.15 deadzone), fire button, pause button; rendered during `playing` on touch devices only |
| Page hardening | `touch-action: none`, `overscroll-behavior: none`, viewport meta (`viewport-fit=cover`, no user scaling), Canvas `dpr` capped at 2, media queries so menus fit phone portrait |

## Verification

Chrome DevTools device emulation (390×844×3, mobile+touch): joystick drag via synthetic pointer events moves the ship; ship stops at visible screen edges in portrait; fire button shoots; pause button pauses; menu renders cleanly in portrait. Desktop unaffected (controls hidden, bounds unchanged on wide viewports). Lint + build. No commits.
