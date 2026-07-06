# Plan: Phase 3 — Deployment, Hardening & Performance

**Date:** 2026-07-06
**Status:** Planned (approved host: Vercel) — not yet implemented

## Key finding

The JS bundle (1.35 MB / ~380 KB gz) is NOT the problem. **Ship GLBs total ~65 MB**
(time-machine 18 MB, starship 18 MB, space-shuttle 10 MB, planet-express 8.7 MB,
tie-fighter 6.6 MB) and every ship is preloaded at boot via `useGLTF.preload` in each
`src/ships/*.tsx`. A first visit downloads ~65 MB before the loading screen clears.
Asset weight is the milestone's centerpiece.

## A. Asset weight (highest impact)

1. **Compress all GLBs** with `npx @gltf-transform/cli optimize` (meshopt compression,
   texture resize/WebP, prune/weld/quantize). Expect 65 MB → single-digit MB total.
   Requires wiring the meshopt decoder into `useGLTF`. Verify each ship visually +
   re-run `scripts/measure-glb.mjs` (transforms should be unchanged; hitboxes stay valid).
2. **Stop preloading all 9 ships at boot.** Preload only the selected ship (persist
   selection?) + the 4 invader models (64 KB total — fine). Other ships load on demand
   inside the ship-selector carousel behind per-ship Suspense. First-load payload ≈ one ship.
3. **nebula.png (1.3 MB) → WebP** (~200 KB, visually identical at these luminance levels).
4. **music.mp3 (1.6 MB)**: already decoded async (non-blocking); optionally re-encode
   192→128 kbps (~1 MB). Low priority.
5. **Bundle the drei Environment HDR locally** (`Environment files="/hdri/night.hdr"`),
   removing the runtime raw.githack.com CDN dependency (offline/prod reliability + no
   third-party fetch).

## B. JS bundle

6. **manualChunks** in vite config: split `three`, `@react-three/*` + `postprocessing`,
   and `react` vendor chunks. Same total bytes but long-term caching (game-code changes
   no longer invalidate the 1 MB three.js chunk) and kills the size warning.

## C. Runtime performance

7. **Per-frame store churn (biggest runtime win):** `updateEnemyPosition` /
   `updateBulletPosition` rebuild the entities array and clone the moved entity **every
   frame per entity** — with 15 bullets + 10 enemies that's ~1,500 array rebuilds/sec of
   GC pressure. Refactor: keep live positions in a module-level mutable registry
   (`Map<id, Vector3>`) written in useFrame and read by the collision system; Zustand
   arrays remain for spawn/despawn rendering only. Medium-effort, isolated to
   entities + collisionSystem.
8. **Star streaming on the GPU:** move the z-scroll into the star vertex shader
   (`z = mod(z0 + uTime*speed, range)`) — removes the per-frame CPU loop over 950 stars
   and the attribute re-upload (`needsUpdate`) every frame. The reset-randomize-x/y
   behavior becomes a hash of the wrap count, or is simply dropped (imperceptible).
9. **Adaptive quality (optional):** drei `<AdaptiveDpr>` or `PerformanceMonitor` to step
   dpr down under sustained load on weak phones. Only if real-device testing shows drops.
10. **Floater cap (low priority):** drei `<Html>` floaters are DOM nodes; cap concurrent
    floaters (~8) if profiling ever shows layout cost.

## D. Hardening

11. **Error boundary around `<Canvas>`** — WebGL unsupported/context-lost shows a styled
    message instead of a white screen.
12. **Favicon + meta:** replace vite.svg with a game icon, add description/OG tags.
13. **PWA manifest** (name, icons, `display: standalone`, portrait orientation) —
    completes the iPhone Add-to-Home-Screen story; optional service worker for offline
    (defer; asset caching via CDN headers is enough initially).
14. **vercel.json cache headers:** immutable long max-age for `/models`, `/sounds`,
    `/textures`, `/hdri` (Vite-hashed JS/CSS is already cache-safe).

## E. Deploy pipeline

15. **Vercel project** linked to the repo: push-to-main deploys prod, branches get
    preview URLs. Vite needs zero config on Vercel.
16. **Post-deploy verification:** cold-load time on throttled 4G, mobile fullscreen +
    touch on a real phone, audio unlock on first tap, HDR/nebula/models all served
    from same origin (network tab), Lighthouse pass.

## Suggested order

1. Asset compression + lazy ships (A1–A2) — do first; it changes what deploy verification measures
2. HDR local + nebula WebP (A5, A3)
3. manualChunks + error boundary + favicon/meta/manifest (B6, D11–13)
4. Vercel setup + cache headers + deploy (E15, D14)
5. Post-deploy verification (E16)
6. Runtime perf refactors (C7–C8) — independent of deployment; can land after the URL is live

Store-churn and GPU-stars refactors (C7–C8) are behavior-preserving and verifiable by
playing the game before/after; everything else is verifiable by network tab + deploy checks.
