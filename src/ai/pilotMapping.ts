/**
 * Decision → input mapping — pure composition of Jev's typed answers.
 *
 * Attack is the default: steer toward the most urgent enemy cell. Evade is a last
 * resort: barrel-roll dodge toward the more open side. Always-be-shooting: firing
 * is always on while engaged. Confidence gates the aim Choices so the ship doesn't
 * jitter on coin-flip decisions. Side-effect free (returns a frame) for testing.
 */

import type { PilotDecision, PilotState } from './types';
import { GAME_CONFIG } from '../config';

export interface PilotInputFrame {
  moveX: number;
  moveY: number;
  firing: boolean;
  /** One-shot request to start a barrel-roll dodge this frame. */
  dodge: boolean;
}

const HORIZONTAL: Record<string, number> = { left: -1, center: 0, right: 1 };
const VERTICAL: Record<string, number> = { up: 1, center: 0, down: -1 };

/** Column of the most urgent (highest-imminence) enemy cell, or null if the board is empty. */
function mostUrgentCol(state: PilotState): number | null {
  let col: number | null = null;
  let maxImminence = 0;
  for (const row of state.grid) {
    for (let c = 0; c < row.length; c++) {
      if (row[c] > maxImminence) {
        maxImminence = row[c];
        col = c;
      }
    }
  }
  return col;
}

/** Choose which way to roll to escape: away from the threat, but never into a wall. */
function computeEscapeDir(state: PilotState): number {
  const shipCol = state.ship.col;
  const threatCol = mostUrgentCol(state) ?? shipCol;
  let dir = threatCol >= shipCol ? -1 : 1;
  if (dir < 0 && shipCol <= 0) dir = 1;
  if (dir > 0 && shipCol >= state.dims.cols - 1) dir = -1;
  return dir;
}

export function decisionToInput(
  decision: PilotDecision,
  state: PilotState
): PilotInputFrame {
  const cfg = GAME_CONFIG.AI_PILOT;

  // Always-be-shooting: the ship holds the trigger the whole time it is engaged.

  // Evade only as a last resort, and only when the model is confident.
  if (
    decision.mode.choice === 'evade' &&
    decision.mode.confidence >= cfg.evadeConfidence
  ) {
    return {
      moveX: computeEscapeDir(state),
      moveY: 0,
      firing: true,
      dodge: true,
    };
  }

  // Attack: steer toward the most urgent enemy; hold (center) on low-confidence axes.
  const moveX =
    decision.aimHorizontal.confidence >= cfg.moveConfidence
      ? HORIZONTAL[decision.aimHorizontal.choice] ?? 0
      : 0;
  const moveY =
    decision.aimVertical.confidence >= cfg.moveConfidence
      ? VERTICAL[decision.aimVertical.choice] ?? 0
      : 0;

  return { moveX, moveY, firing: true, dodge: false };
}
