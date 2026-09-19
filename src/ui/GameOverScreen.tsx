/**
 * GameOverScreen - Game over display
 *
 * Shows final score and restart button.
 * Red-tinted title for game over emphasis.
 *
 * PATTERN: Overlay menu component
 * - Rendered when game phase is 'gameOver'
 * - Can restart or return to menu
 */

import { useCallback, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useEnemyStore } from '../stores/enemyStore';
import { useBulletStore } from '../stores/bulletStore';
import { usePlayerStore } from '../stores/playerStore';
import { useEffectsStore } from '../stores/effectsStore';
import { useAiPilotStore } from '../stores/aiPilotStore';
import { GAME_CONFIG } from '../config';

export function GameOverScreen() {
  const score = useGameStore((state) => state.score);
  const enemyScore = useGameStore((state) => state.enemyScore);
  const aiRequests = useAiPilotStore((state) => state.requests);
  const aiDecisions = useAiPilotStore((state) => state.decisions);
  const aiEngagedMs = useAiPilotStore((state) => state.engagedMs);
  const startGame = useGameStore((state) => state.startGame);
  const resetGame = useGameStore((state) => state.resetGame);
  const clearEnemies = useEnemyStore((state) => state.clearEnemies);
  const clearBullets = useBulletStore((state) => state.clearBullets);
  const clearEffects = useEffectsStore((state) => state.clearEffects);
  const resetPlayer = usePlayerStore((state) => state.resetPlayer);

  // Format score with leading zeros
  const formattedScore = score.toString().padStart(6, '0');

  // AI pilot session stats (shown only if the pilot actually ran this game)
  const kills = Math.round(score / GAME_CONFIG.POINTS_PER_ENEMY);
  const escapes = Math.round(enemyScore / 10);
  const engagedSec = aiEngagedMs / 1000;
  const decisionsPerSec = engagedSec > 0 ? aiDecisions / engagedSec : 0;
  const requestsPerSec = engagedSec > 0 ? aiRequests / engagedSec : 0;
  const killRate =
    kills + escapes > 0 ? Math.round((kills / (kills + escapes)) * 100) : 0;

  // Play again - clear state and restart
  const handlePlayAgain = useCallback(() => {
    clearEnemies();
    clearBullets();
    clearEffects();
    resetPlayer();
    startGame();
  }, [startGame, clearEnemies, clearBullets, clearEffects, resetPlayer]);

  // Listen for Enter key to play again
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Enter') {
        event.preventDefault();
        handlePlayAgain();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayAgain]);

  // Return to menu
  const handleMenu = useCallback(() => {
    clearEnemies();
    clearBullets();
    clearEffects();
    resetPlayer();
    resetGame();
  }, [resetGame, clearEnemies, clearBullets, clearEffects, resetPlayer]);

  return (
    <div className="menu-overlay game-over">
      <h1>GAME OVER</h1>

      <p className="final-score">FINAL SCORE: {formattedScore}</p>

      {aiRequests > 0 && (
        <div className="ai-stats">
          <h2>AI PILOT — SESSION STATS</h2>
          <div className="ai-stat-row">
            <span>Kills vs escapes</span>
            <span>
              {kills} / {escapes}
            </span>
          </div>
          <div className="ai-stat-row">
            <span>Kill rate</span>
            <span>{killRate}%</span>
          </div>
          <div className="ai-stat-row">
            <span>Decisions / sec</span>
            <span>{decisionsPerSec.toFixed(1)}</span>
          </div>
          <div className="ai-stat-row">
            <span>Requests / sec</span>
            <span>{requestsPerSec.toFixed(1)}</span>
          </div>
          <div className="ai-stat-row">
            <span>Total decisions</span>
            <span>{aiDecisions}</span>
          </div>
          <div className="ai-stat-row">
            <span>Time engaged</span>
            <span>{engagedSec.toFixed(0)}s</span>
          </div>
        </div>
      )}

      <p className="start-hint">Press ENTER to play again</p>
      <button onClick={handlePlayAgain}>PLAY AGAIN</button>

      <button
        onClick={handleMenu}
        style={{ marginTop: '1rem', opacity: 0.7 }}
      >
        MAIN MENU
      </button>
    </div>
  );
}
