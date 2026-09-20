/**
 * AiPilotController - headless driver for the TypeSafe autopilot.
 *
 * Mounted once in App (outside the Canvas — it does no rendering, just runs
 * effects). Two responsibilities:
 *   1. Hotkeys: toggle the pilot with AI_PILOT.toggleKey; any movement key while
 *      engaged hands control straight back to the human.
 *   2. An EVENT-DRIVEN, single-flight decision loop: while engaged and playing it
 *      polls cheaply (no network) and only asks /api/pilot when something
 *      meaningful changes — the front target was killed/replaced, or an invader
 *      started diving — plus an adaptive safety refresh (short while diving, long
 *      when calm). Steady-state aiming is all code (target lock + vernier in
 *      Player.tsx), so most ticks make ZERO requests. A rate ceiling caps it at
 *      ~2/sec. The ship executes the last decision every frame in between.
 *
 * The loop stops on toggle-off, pause, game-over, unmount, and tab-hidden, and
 * auto-disables after too many consecutive failures.
 */

import { useEffect, useRef } from 'react';
import { GAME_CONFIG } from '../config';
import { aiInput, resetAiInput } from './aiInput';
import { buildPilotState } from './pilotState';
import { decisionToInput } from './pilotMapping';
import { requestDecision } from './pilotClient';
import { useAiPilotStore } from '../stores/aiPilotStore';
import { useGameStore } from '../stores/gameStore';
import { useEnemyStore } from '../stores/enemyStore';
import { isMovementKey } from '../hooks/useKeyboard';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AiPilotController() {
  const enabled = useAiPilotStore((state) => state.enabled);
  const phase = useGameStore((state) => state.phase);

  // Reset per-game stats on a fresh start (menu/gameOver -> playing), but NOT
  // when resuming from pause.
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (phase === 'playing' && prev !== 'paused') {
      useAiPilotStore.getState().resetStats();
    }
  }, [phase]);

  // Hotkeys: toggle with the configured key; movement keys hand control back.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const gamePhase = useGameStore.getState().phase;
      const ai = useAiPilotStore.getState();

      if (event.code === GAME_CONFIG.AI_PILOT.toggleKey) {
        if (gamePhase === 'playing') {
          event.preventDefault();
          ai.toggle();
        }
        return;
      }

      if (ai.enabled && isMovementKey(event.code)) {
        ai.setEnabled(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Self-clocked decision loop — runs only while engaged and actively playing.
  useEffect(() => {
    if (!enabled || phase !== 'playing') {
      resetAiInput();
      return;
    }

    const cfg = GAME_CONFIG.AI_PILOT;
    const store = useAiPilotStore.getState();
    const segStart = Date.now(); // wall-clock this engagement segment began
    store.setEngageStart(segStart); // enables live engaged-time in the HUD
    let stopped = false;
    let failures = 0;
    let tickController: AbortController | null = null;

    const run = async () => {
      let requests = 0;
      let lastMostUrgentId: string | null = null;
      let lastDecisionAt = 0; // 0 = no decision made yet this engagement

      while (!stopped) {
        // No point deciding while the tab is hidden.
        if (typeof document !== 'undefined' && document.hidden) {
          await delay(cfg.pollIntervalMs);
          continue;
        }

        // Engagement time limit — auto-disengage after maxEngageMs at a time.
        if (Date.now() - segStart >= cfg.maxEngageMs) {
          store.setEnabled(false); // re-engage (P / button) to keep playing
          break;
        }

        // Cheap, local board read (NO network) to decide whether to call the model.
        const enemies = useEnemyStore.getState().enemies;
        let mostUrgentId: string | null = null;
        let nearThreat = false;
        if (enemies.length > 0) {
          let top = enemies[0];
          for (const e of enemies) {
            if (e.position.z > top.position.z) top = e;
            if (e.phase === 'attacking') nearThreat = true; // an invader is diving
          }
          mostUrgentId = top.id;
        }

        const now = Date.now();
        const sinceLast = now - lastDecisionAt;

        // Rate ceiling: never decide faster than minTickIntervalMs.
        if (lastDecisionAt !== 0 && sinceLast < cfg.minTickIntervalMs) {
          await delay(cfg.pollIntervalMs);
          continue;
        }

        // Event-driven: decide on a meaningful change, else on an adaptive refresh
        // (short while an invader is diving so evade stays timely; long when calm).
        const refreshMs = nearThreat ? cfg.activeRefreshMs : cfg.idleRefreshMs;
        const shouldDecide =
          lastDecisionAt === 0 || // first decision of the engagement
          mostUrgentId !== lastMostUrgentId || // front target killed / replaced / a diver overtook it
          sinceLast >= refreshMs; // periodic re-check (mode may need to flip)

        if (!shouldDecide) {
          await delay(cfg.pollIntervalMs);
          continue;
        }

        // --- one decision (this is the only place we hit the network) ---
        let failedThisTick = false;
        const state = buildPilotState();
        tickController = new AbortController();
        const timer = setTimeout(
          () => tickController?.abort(),
          cfg.requestTimeoutMs
        );
        requests += 1;
        store.recordRequest();
        lastDecisionAt = now;
        lastMostUrgentId = mostUrgentId;

        try {
          store.setStatus('thinking');
          const decision = await requestDecision(state, tickController.signal);
          clearTimeout(timer);
          if (stopped) break;

          const frame = decisionToInput(decision, state);
          aiInput.moveX = frame.moveX;
          aiInput.moveY = frame.moveY;
          aiInput.firing = frame.firing;
          if (frame.dodge) aiInput.dodge = true; // one-shot; Player consumes it
          store.pushDecision(decision);
          store.recordDecision();
          store.setStatus('idle');
          failures = 0;
        } catch {
          clearTimeout(timer);
          if (stopped) break;
          failures += 1;
          failedThisTick = true;
          store.setStatus('error');
          if (failures >= cfg.maxConsecutiveFailures) {
            store.setEnabled(false); // flips `enabled` → effect cleanup resets input
            break;
          }
        }

        // Safety cap: never hammer the API — auto-disengage after N requests.
        if (requests >= cfg.maxRequestsPerEngage) {
          store.setEnabled(false); // re-engage (P / button) to keep playing
          break;
        }

        // Brief backoff after a failed tick before the next poll.
        if (failedThisTick && cfg.failureBackoffMs > 0) {
          await delay(cfg.failureBackoffMs);
        }
      }
    };

    void run();

    return () => {
      stopped = true;
      tickController?.abort();
      store.addEngaged(Date.now() - segStart);
      store.setEngageStart(null);
      resetAiInput();
    };
  }, [enabled, phase]);

  return null;
}
