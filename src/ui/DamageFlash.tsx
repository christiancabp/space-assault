/**
 * DamageFlash - Hit feedback overlays
 *
 * Two layers:
 * - A red radial flash that plays once each time a life is lost
 *   (re-keying the div restarts the CSS animation)
 * - A persistent subtle red vignette while on the last life
 *
 * PATTERN: HTML overlay over Canvas; pointer-events disabled so it
 * never blocks input. Uses the adjust-state-during-render pattern
 * (not an effect) to detect the lives drop.
 */

import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';

export function DamageFlash() {
  const lives = useGameStore((state) => state.lives);
  const [prevLives, setPrevLives] = useState(lives);
  const [flashKey, setFlashKey] = useState(0);

  // Adjust state during render when the subscribed value changes
  if (lives !== prevLives) {
    if (lives < prevLives) {
      setFlashKey(flashKey + 1);
    }
    setPrevLives(lives);
  }

  return (
    <>
      {flashKey > 0 && <div key={flashKey} className="damage-flash" />}
      {lives === 1 && <div className="low-lives-vignette" />}
    </>
  );
}
