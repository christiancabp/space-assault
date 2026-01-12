/**
 * EnemyManager - Spawns and renders enemies
 *
 * Handles:
 * - Timed spawning of new enemies
 * - Rendering all active enemies
 *
 * PATTERN: Manager with spawning logic
 * - useFrame for spawn timing
 * - Subscribes to enemy array for rendering
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useEnemyStore, createEnemy } from '../stores/enemyStore';
import { useGameStore } from '../stores/gameStore';
import { Enemy } from './Enemy';
import { GAME_CONFIG } from '../config';

export function EnemyManager() {
  // Track time since last spawn
  const lastSpawnTime = useRef(0);

  // Enemy counter for unique IDs
  const enemyCounter = useRef(0);

  // Store actions and state
  const enemies = useEnemyStore((state) => state.enemies);
  const addEnemy = useEnemyStore((state) => state.addEnemy);
  const phase = useGameStore((state) => state.phase);

  // Spawn logic runs every frame
  useFrame((state) => {
    // Only spawn during active gameplay
    if (phase !== 'playing') return;

    const now = state.clock.elapsedTime * 1000; // Convert to ms

    // Check if it's time to spawn a new enemy
    if (now - lastSpawnTime.current > GAME_CONFIG.ENEMY_SPAWN_INTERVAL) {
      // Create unique ID
      const id = `enemy-${enemyCounter.current++}`;

      // Create and add new enemy
      const newEnemy = createEnemy(id);
      addEnemy(newEnemy);

      lastSpawnTime.current = now;
    }
  });

  return (
    <>
      {enemies.map((enemy) => (
        <Enemy key={enemy.id} enemy={enemy} />
      ))}
    </>
  );
}
