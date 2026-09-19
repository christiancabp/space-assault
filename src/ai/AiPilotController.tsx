/**
 * AiPilotController - headless driver for the TypeSafe autopilot.
 *
 * Mounted once in App (outside the Canvas — it does no rendering, just runs
 * effects). Two responsibilities:
 *   1. Hotkeys: toggle the pilot with AI_PILOT.toggleKey; any movement key while
 *      engaged hands control straight back to the human.
 *   2. A self-clocked, single-flight decision loop: while engaged and playing,
 *      snapshot the game, ask /api/pilot, map the decision into aiInput, then
 *      immediately issue the next request. The ship executes the last decision
 *      every frame in between (see Player.tsx).
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

      while (!stopped) {
        // No point deciding while the tab is hidden.
        if (typeof document !== 'undefined' && document.hidden) {
          await delay(200);
          continue;
        }

        const tickStart = Date.now();
        let failedThisTick = false;
        const state = buildPilotState();
        tickController = new AbortController();
        const timer = setTimeout(
          () => tickController?.abort(),
          cfg.requestTimeoutMs
        );
        requests += 1;
        store.recordRequest();

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

        // Throttle: keep a minimum gap between request starts. On success this is
        // just minTickIntervalMs; a failed tick additionally waits failureBackoffMs.
        const elapsed = Date.now() - tickStart;
        const wait = Math.max(
          failedThisTick ? cfg.failureBackoffMs : 0,
          cfg.minTickIntervalMs - elapsed
        );
        if (wait > 0) await delay(wait);
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
