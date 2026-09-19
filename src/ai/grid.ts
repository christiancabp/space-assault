/**
 * Enemy grid — bins the playfield into a 2D matrix the model (and the mini-map)
 * can read at a glance.
 *
 * The game is effectively 2D from behind the ship: enemies keep their spawn x/y
 * and only advance in z (see Enemy.tsx). So each enemy is a fixed cell; its z
 * becomes an "imminence" score (1 = far, 9 = about to reach and pass the ship).
 * Only the ship moves across the grid. Pure + easy to unit test.
 */

import type { Enemy, Vector3 } from '../types/game.types';
import type { PlayBounds } from '../stores/playAreaStore';
import { GAME_CONFIG } from '../config';

export interface GridModel {
  cols: number;
  rows: number;
  /** rows top(0)->bottom; each cell is 0 (empty) or 1-9 (9 = about to reach the ship). */
  cells: number[][];
  /** the ship's current cell */
  ship: { col: number; row: number };
}

/** Map a value in [lo, hi] to an integer bin index in [0, n-1]. */
function toBin(value: number, lo: number, hi: number, n: number): number {
  if (hi <= lo) return 0;
  const t = (value - lo) / (hi - lo);
  return Math.min(n - 1, Math.max(0, Math.floor(t * n)));
}

/** Enemy z -> imminence 1..9 (9 = at/over the player plane, about to escape). */
function imminence(z: number): number {
  const { ENEMY_SPAWN_Z, PLAYER_Z } = GAME_CONFIG;
  const t = (z - ENEMY_SPAWN_Z) / (PLAYER_Z - ENEMY_SPAWN_Z); // 0 far .. 1 at player
  return Math.min(9, Math.max(1, Math.round(1 + t * 8)));
}

export function buildGrid(
  ship: Vector3,
  enemies: Enemy[],
  bounds: PlayBounds,
  cols: number,
  rows: number
): GridModel {
  const height = bounds.maxY - bounds.minY;
  const cells: number[][] = Array.from({ length: rows }, () =>
    new Array<number>(cols).fill(0)
  );

  for (const e of enemies) {
    const col = toBin(e.position.x, bounds.minX, bounds.maxX, cols);
    // row 0 = top (maxY), so invert y
    const row = toBin(bounds.maxY - e.position.y, 0, height, rows);
    const im = imminence(e.position.z);
    if (im > cells[row][col]) cells[row][col] = im; // keep the most urgent per cell
  }

  return {
    cols,
    rows,
    cells,
    ship: {
      col: toBin(ship.x, bounds.minX, bounds.maxX, cols),
      row: toBin(bounds.maxY - ship.y, 0, height, rows),
    },
  };
}
