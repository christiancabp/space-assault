/**
 * MiniMap - a live grid view of the playfield (what the AI pilot "sees").
 *
 * Renders the same grid the model receives: enemies colored by imminence
 * (green -> amber -> red), the ship cell highlighted. Rebuilds a few times a
 * second from the stores via a timer (no per-frame React churn). A study/debug
 * instrument; hidden on touch devices to avoid overlapping the on-screen controls.
 */

import { useEffect, useState } from 'react';
import { GAME_CONFIG } from '../config';
import { buildGrid, type GridModel } from '../ai/grid';
import { usePlayerStore } from '../stores/playerStore';
import { useEnemyStore } from '../stores/enemyStore';
import { usePlayAreaStore } from '../stores/playAreaStore';

const REFRESH_MS = 120;

function cellClass(imminence: number): string {
  if (imminence >= 8) return 'mini-cell enemy im-hi';
  if (imminence >= 5) return 'mini-cell enemy im-mid';
  return 'mini-cell enemy im-lo';
}

export function MiniMap() {
  const [grid, setGrid] = useState<GridModel | null>(null);

  useEffect(() => {
    const { gridCols, gridRows } = GAME_CONFIG.AI_PILOT;
    const tick = () => {
      const ship = usePlayerStore.getState().position;
      const enemies = useEnemyStore.getState().enemies;
      const bounds = usePlayAreaStore.getState().bounds;
      setGrid(buildGrid(ship, enemies, bounds, gridCols, gridRows));
    };
    tick();
    const handle = setInterval(tick, REFRESH_MS);
    return () => clearInterval(handle);
  }, []);

  if (!grid) return null;

  return (
    <div className="mini-map-wrap">
      <div className="mini-map-label">AI VIEW</div>
      <div
        className="mini-map"
        style={{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)` }}
      >
        {grid.cells.map((row, r) =>
          row.map((imminence, c) => {
            const isShip = grid.ship.row === r && grid.ship.col === c;
            if (isShip) {
              return (
                <div key={`${r}-${c}`} className="mini-cell ship">
                  ▲
                </div>
              );
            }
            if (imminence > 0) {
              return (
                <div key={`${r}-${c}`} className={cellClass(imminence)}>
                  {imminence}
                </div>
              );
            }
            return <div key={`${r}-${c}`} className="mini-cell" />;
          })
        )}
      </div>
    </div>
  );
}
