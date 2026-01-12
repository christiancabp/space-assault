import type { GLTF } from 'three-stdlib'
import type { ObjectMap } from '@react-three/fiber'

/**
 * Ship Types - Type definitions for the ship system
 *
 * Defines configuration types for ships including transforms,
 * hitboxes, and engine mounts for future propulsion effects.
 */

// Available ship identifiers
// Future: | 'tie-fighter' | 'planet-express' | 'starship' | etc.
export type ShipId = 'rocketship';

// Engine mount for propulsion effects (future use)
export interface EngineMount {
  position: [number, number, number]; // Relative to ship center
  scale: number; // Effect size multiplier
  color?: string; // Override default flame color
}

// Transform configuration for positioning the model
export interface ShipTransform {
  scale: [number, number, number];
  rotation: [number, number, number]; // Euler angles
  positionOffset: [number, number, number]; // Offset from group center
}

// Hitbox for collision detection
export interface ShipHitbox {
  width: number;
  height: number;
  depth: number;
}

// Full ship configuration
export interface ShipConfig {
  id: ShipId;
  displayName: string;
  transform: ShipTransform;
  hitbox: ShipHitbox;
  engines: EngineMount[]; // For future propulsion effects
}


export type GLTFResult = GLTF & ObjectMap
