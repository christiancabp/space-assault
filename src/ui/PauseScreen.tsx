/**
 * PauseScreen - Pause overlay
 *
 * Displays when game is paused (Escape key).
 * Allows resuming or returning to main menu.
 */

import { useCallback, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useEnemyStore } from '../stores/enemyStore';
import { useBulletStore } from '../stores/bulletStore';
import { usePlayerStore } from '../stores/playerStore';

export function PauseScreen() {
  const resumeGame = useGameStore((state) => state.resumeGame);
  const resetGame = useGameStore((state) => state.resetGame);
  const clearEnemies = useEnemyStore((state) => state.clearEnemies);
  const clearBullets = useBulletStore((state) => state.clearBullets);
  const resetPlayer = usePlayerStore((state) => state.resetPlayer);

  // Handle resume
  const handleResume = useCallback(() => {
    resumeGame();
  }, [resumeGame]);

  // Handle quit to menu
  const handleQuit = useCallback(() => {
    clearEnemies();
    clearBullets();
    resetPlayer();
    resetGame();
  }, [resetGame, clearEnemies, clearBullets, resetPlayer]);

  // Listen for Enter to resume
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Enter') {
        event.preventDefault();
        handleResume();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResume]);

  return (
    <div className="menu-overlay pause-screen">
      <h1>PAUSED</h1>

      <p>Press ENTER to resume</p>

      <div className="pause-buttons">
        <button onClick={handleResume}>RESUME</button>
        <button onClick={handleQuit} className="secondary">QUIT TO MENU</button>
      </div>
    </div>
  );
}
