/**
 * App - Main application component
 *
 * Orchestrates the game canvas and UI overlays.
 * UI is rendered as HTML on top of the 3D canvas.
 *
 * PATTERN: Layered rendering
 * - Canvas (3D) is the base layer, always visible
 * - HTML overlays render on top based on game phase
 * - This allows smooth transitions without remounting canvas
 */

import { useEffect } from 'react';
import { Game } from './game/Game';
import { HUD } from './ui/HUD';
import { StartScreen } from './ui/StartScreen';
import { GameOverScreen } from './ui/GameOverScreen';
import { PauseScreen } from './ui/PauseScreen';
import { ShipSelector } from './shipSelector/ShipSelector';
import { useGameStore } from './stores/gameStore';
import { initAudio } from './audio/soundManager';
import './index.css';

function App() {
  // Subscribe to game phase for conditional UI rendering
  const phase = useGameStore((state) => state.phase);
  const pauseGame = useGameStore((state) => state.pauseGame);

  // Initialize audio system once (idempotent; resumes on first game start)
  useEffect(() => {
    initAudio();
  }, []);

  // Listen for Enter key to pause during gameplay
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Enter' && phase === 'playing') {
        event.preventDefault();
        pauseGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, pauseGame]);

  return (
    <div className="app">
      {/* 3D Game Canvas - always rendered */}
      <Game />

      {/* HTML UI Overlays - conditionally rendered based on phase */}
      {phase === 'menu' && <StartScreen />}
      {phase === 'shipSelect' && <ShipSelector />}
      {(phase === 'playing' || phase === 'paused') && <HUD />}
      {phase === 'paused' && <PauseScreen />}
      {phase === 'gameOver' && <GameOverScreen />}
    </div>
  );
}

export default App;
