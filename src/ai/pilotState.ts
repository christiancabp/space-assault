/**
 * Pilot state builder — turns live game state into the compact grid snapshot Jev
 * sees. Reads the Zustand stores via getState() and delegates the binning to the
 * pure `buildGrid` (which the mini-map also uses).
 */

import type { PilotState } from './types';
import { buildGrid } from './grid';
import { usePlayerStore } from '../stores/playerStore';
import { useEnemyStore } from '../stores/enemyStore';
import { usePlayAreaStore } from '../stores/playAreaStore';
import { GAME_CONFIG } from '../config';

export function buildPilotState(): PilotState {
  const ship = usePlayerStore.getState().position;
  const enemies = useEnemyStore.getState().enemies;
  const bounds = usePlayAreaStore.getState().bounds;
  const { gridCols, gridRows } = GAME_CONFIG.AI_PILOT;

  const grid = buildGrid(ship, enemies, bounds, gridCols, gridRows);
  return {
    grid: grid.cells,
    dims: { cols: grid.cols, rows: grid.rows },
    ship: grid.ship,
  };
}
