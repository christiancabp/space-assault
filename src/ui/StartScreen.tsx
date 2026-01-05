/**
 * StartScreen - Game start menu
 *
 * Displays title, controls info, and start button.
 * Clean, minimalist design for sci-fi aesthetic.
 *
 * PATTERN: Overlay menu component
 * - Rendered when game phase is 'menu'
 * - Triggers game start via store action
 */

import { useCallback, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useEnemyStore } from '../stores/enemyStore';
import { useBulletStore } from '../stores/bulletStore';
import { usePlayerStore } from '../stores/playerStore';

export function StartScreen() {
  const startGame = useGameStore((state) => state.startGame);
  const clearEnemies = useEnemyStore((state) => state.clearEnemies);
  const clearBullets = useBulletStore((state) => state.clearBullets);
  const resetPlayer = usePlayerStore((state) => state.resetPlayer);

  // Handle game start - clear any leftover state and begin
  const handleStart = useCallback(() => {
    // Clear any entities from previous game
    clearEnemies();
    clearBullets();
    resetPlayer();

    // Start the game
    startGame();
  }, [startGame, clearEnemies, clearBullets, resetPlayer]);

  // Listen for Enter key to start game
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Enter') {
        event.preventDefault();
        handleStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStart]);

  return (
    <div className="menu-overlay">
      <h1>SPACE ASSAULT</h1>

      <div className="controls-info">
        <h2>CONTROLS</h2>
        <div className="control-row">
          <span className="key-group">W A S D</span>
          <span className="control-label">or</span>
          <span className="key-group">&uarr; &larr; &darr; &rarr;</span>
          <span className="control-label">Move ship</span>
        </div>
        <div className="control-row">
          <span className="key-group">SPACE</span>
          <span className="control-label">Fire weapons</span>
        </div>
        <div className="control-row">
          <span className="key-group">ENTER</span>
          <span className="control-label">Pause game</span>
        </div>
      </div>

      <p className="start-hint">Press ENTER to start</p>
      <button onClick={handleStart}>START GAME</button>
    </div>
  );
}
