/**
 * Core type definitions for Space Assault
 * These types define the shape of game entities and state
 */

// Simple 3D vector for positions and velocities
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Base entity that all game objects extend
export interface Entity {
  id: string;
  position: Vector3;
  velocity: Vector3;
}

// Enemy phases - Galaga-style behavior
// 'approaching' - slow, predictable movement toward player
// 'attacking' - fast, aggressive dive toward player
// 'retreating' - exiting the screen
export type EnemyPhase = 'approaching' | 'attacking' | 'retreating';

// Enemy entity with health and behavior phase
export interface Enemy extends Entity {
  health: number;
  phase: EnemyPhase;
}

// Bullet entity - tracks who fired it for collision logic
export interface Bullet extends Entity {
  ownerId: 'player' | string; // 'player' or enemy id
}

// Game state machine phases
// 'menu' - title screen, waiting to start
// 'shipSelect' - choosing a ship from the roster
// 'playing' - active gameplay
// 'paused' - game paused (future feature)
// 'gameOver' - player lost, showing results
export type GamePhase = 'menu' | 'shipSelect' | 'playing' | 'paused' | 'gameOver';

// Player state shape
export interface PlayerState {
  position: Vector3;
  isInvulnerable: boolean; // Brief invulnerability after getting hit
}

// Explosion effect - spawned at a destruction point, removed after its lifetime
export interface Explosion {
  id: string;
  position: Vector3;
  color: string; // Outer particle color (usually the destroyed entity's color)
}
