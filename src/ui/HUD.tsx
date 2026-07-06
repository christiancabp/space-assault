/**
 * HUD - Heads-Up Display
 *
 * Shows score and lives during gameplay.
 * - Score value pops (scale + glow) each time it changes: re-keying the
 *   span by score restarts its CSS animation
 * - Lives readout pulses red on the last life
 *
 * PATTERN: HTML overlay over Canvas
 * - Uses CSS positioning (defined in index.css)
 * - Subscribes to specific store slices to minimize re-renders
 */

import { useGameStore } from '../stores/gameStore';

export function HUD() {
  // Subscribe only to the values we display
  const score = useGameStore((state) => state.score);
  const lives = useGameStore((state) => state.lives);

  // Format score with leading zeros (e.g., "000100")
  const formattedScore = score.toString().padStart(6, '0');

  // Display lives as diamond symbols
  const livesDisplay = '◆'.repeat(lives);

  return (
    <div className="hud">
      <div className="score">
        SCORE:{' '}
        <span key={score} className="score-value">
          {formattedScore}
        </span>
      </div>
      <div className={`lives${lives === 1 ? ' danger' : ''}`}>
        LIVES: {livesDisplay}
      </div>
    </div>
  );
}
