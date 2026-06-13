/**
 * ShipSelector - Full-screen ship selection overlay
 *
 * Lets the player browse the ship roster one at a time with a live 3D
 * preview, then commit a choice. Rendered when game phase is 'shipSelect'.
 *
 * PATTERN: Overlay menu component (matches StartScreen / PauseScreen)
 * - Local browsing `index` is initialized from the committed selection so
 *   BACK can cancel without mutating the store; only SELECT commits.
 */

import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { SHIP_IDS, getShipConfig } from '../config/shipConfigs';
import { ShipPreviewCanvas } from './ShipPreviewCanvas';

export function ShipSelector() {
  const selectedShipId = usePlayerStore((state) => state.selectedShipId);
  const setShipId = usePlayerStore((state) => state.setShipId);
  const closeShipSelect = useGameStore((state) => state.closeShipSelect);

  // Browsing position - starts on the currently selected ship
  const [index, setIndex] = useState(() => {
    const i = SHIP_IDS.indexOf(selectedShipId);
    return i >= 0 ? i : 0;
  });

  const shipId = SHIP_IDS[index];
  const config = getShipConfig(shipId);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + SHIP_IDS.length) % SHIP_IDS.length);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % SHIP_IDS.length);
  }, []);

  const select = useCallback(() => {
    setShipId(SHIP_IDS[index]);
    closeShipSelect();
  }, [index, setShipId, closeShipSelect]);

  // Keyboard navigation while the selector is open
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          event.preventDefault();
          prev();
          break;
        case 'ArrowRight':
        case 'KeyD':
          event.preventDefault();
          next();
          break;
        case 'Enter':
          event.preventDefault();
          select();
          break;
        case 'Escape':
          event.preventDefault();
          closeShipSelect();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prev, next, select, closeShipSelect]);

  return (
    <div className="menu-overlay ship-selector">
      <h1>SELECT YOUR SHIP</h1>

      <div className="ship-stage">
        <button className="ship-nav-arrow" onClick={prev} aria-label="Previous ship">
          &#9664;
        </button>

        <div className="ship-preview">
          <ShipPreviewCanvas shipId={shipId} interactive />
        </div>

        <button className="ship-nav-arrow" onClick={next} aria-label="Next ship">
          &#9654;
        </button>
      </div>

      <div className="ship-name">{config.displayName}</div>
      <div className="ship-index">
        {index + 1} / {SHIP_IDS.length}
      </div>

      <div className="ship-select-buttons">
        <button onClick={select}>SELECT</button>
        <button className="secondary" onClick={closeShipSelect}>
          BACK
        </button>
      </div>

      <p className="start-hint">&#9664; &#9654; browse &middot; drag to rotate &middot; ENTER select &middot; ESC back</p>
    </div>
  );
}
