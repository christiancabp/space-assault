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

export function GameOverScreen() {
  const score = useGameStore((state) => state.score);
  const startGame = useGameStore((state) => state.startGame);
  const resetGame = useGameStore((state) => state.resetGame);
  const clearEnemies = useEnemyStore((state) => state.clearEnemies);
  const clearBullets = useBulletStore((state) => state.clearBullets);
  const clearEffects = useEffectsStore((state) => state.clearEffects);
  const resetPlayer = usePlayerStore((state) => state.resetPlayer);

  // Format score with leading zeros
  const formattedScore = score.toString().padStart(6, '0');

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
