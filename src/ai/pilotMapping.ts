/**
 * Decision → input mapping — pure composition of Jev's typed answers.
 *
 * Attack is the default: aim under the nearest invader and fire when lined up.
 * Evade is a last resort: when the model is confident danger is imminent, trigger
 * a barrel-roll dodge (i-frames) toward the more open side. Confidence gates the
 * aim Choices so the ship doesn't jitter on coin-flip decisions.
 *
 * Kept side-effect free (returns a frame) so it is trivial to unit test.
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

/** Choose which way to roll to escape: away from the nearest threat, but never into a wall. */
function computeEscapeDir(state: PilotState): number {
  const shipX = state.ship.x;
  const [minX, maxX] = state.playfield.x;
  const threat = state.invaders.find((i) => i.diving) ?? state.invaders[0];
  let dir = threat ? (threat.x >= shipX ? -1 : 1) : 1;

  // Don't dodge into the edge; flip toward open space if cornered.
  const margin = 1;
  if (dir < 0 && shipX - minX < margin) dir = 1;
  if (dir > 0 && maxX - shipX < margin) dir = -1;
  return dir;
}

export function decisionToInput(
  decision: PilotDecision,
  state: PilotState
): PilotInputFrame {
  const cfg = GAME_CONFIG.AI_PILOT;

  // Always-be-shooting: the ship holds the trigger the whole time it is engaged
  // (like a human leaving Space held down), so `firing` is always true.

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

  // Attack: aim under the nearest invader; hold (center) on low-confidence axes.
  const moveX =
    decision.aimHorizontal.confidence >= cfg.moveConfidence
      ? HORIZONTAL[decision.aimHorizontal.choice] ?? 0
      : 0;
  const moveY =
    decision.aimVertical.confidence >= cfg.moveConfidence
      ? VERTICAL[decision.aimVertical.choice] ?? 0
      : 0;

  return {
    moveX,
    moveY,
    firing: true,
    dodge: false,
  };
}
