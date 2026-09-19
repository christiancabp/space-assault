/**
 * Pilot state builder — turns live game state into the compact snapshot Jev sees.
 *
 * `computePilotState` is a pure function (easy to unit test); `buildPilotState`
 * is the thin wrapper that reads the Zustand stores via getState() and calls it.
 * Coordinates are absolute game units, rounded for a small, legible payload.
 */

import type { Enemy, Vector3 } from '../types/game.types';
import type { PlayBounds } from '../stores/playAreaStore';
import type { PilotState, PilotInvader } from './types';
import { usePlayerStore } from '../stores/playerStore';
import { useEnemyStore } from '../stores/enemyStore';
import { usePlayAreaStore } from '../stores/playAreaStore';
import { GAME_CONFIG } from '../config';

/** Round to 2 decimals to keep the payload small and human-readable. */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Pure core: build the snapshot from raw inputs. */
export function computePilotState(
  ship: Vector3,
  enemies: Enemy[],
  bounds: PlayBounds,
  maxInvaders: number
): PilotState {
  const invaders: PilotInvader[] = enemies
    .map((e): PilotInvader => {
      const dx = e.position.x - ship.x;
      const dy = e.position.y - ship.y;
      const dz = e.position.z - ship.z;
      return {
        x: round(e.position.x),
        y: round(e.position.y),
        z: round(e.position.z),
        distance: round(Math.hypot(dx, dy, dz)),
        diving: e.phase === 'attacking',
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxInvaders);

  return {
    ship: { x: round(ship.x), y: round(ship.y) },
    playfield: {
      x: [round(bounds.minX), round(bounds.maxX)],
      y: [round(bounds.minY), round(bounds.maxY)],
    },
    invaders,
  };
}

/** Gather live game state from the stores and build the snapshot. */
export function buildPilotState(): PilotState {
  const ship = usePlayerStore.getState().position;
  const enemies = useEnemyStore.getState().enemies;
  const bounds = usePlayAreaStore.getState().bounds;
  return computePilotState(
    ship,
    enemies,
    bounds,
    GAME_CONFIG.AI_PILOT.maxInvaders
  );
}
