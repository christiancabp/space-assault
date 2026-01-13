/**
 * Ship Configurations - Transform, hitbox, and engine data for each ship
 *
 * Each ship needs different adjustments based on how the 3D model was created.
 * Engine mounts define where propulsion effects will appear (future feature).
 */

import type { ShipId, ShipConfig } from '../types/ship.types';

// Ship configurations indexed by ShipId
export const SHIP_CONFIGS: Record<ShipId, ShipConfig> = {
  rocketship: {
    id: 'rocketship',
    displayName: 'Rocketship',
    transform: {
      // Scale to match game units
      scale: [0.1, 0.1, 0.1],
      // Rotate to face negative Z (toward enemies)
      rotation: [Math.PI, 0, 0],
      // Center offset if needed
      positionOffset: [0, 0, 0],
    },
    hitbox: {
      width: 1,
      height: 1,
      depth: 1,
    },
    // Single center engine at rear of ship
    engines: [
      {
        position: [0, 0, 0.5],
        scale: 1.0,
        color: '#ff6600' // Optional: override default flame color
      },
    ],
  },

  'guardians-ship': {
    id: 'guardians-ship',
    displayName: 'Milano',
    transform: {
      // Scale to match game units (adjust as needed)
      scale: [0.0006, 0.0006, 0.0006],
      // Rotate to face negative Z (toward enemies)
      rotation: [0, 0, 0],
      // Center offset if needed
      positionOffset: [0, 0, 0],
    },
    hitbox: {
      width: 2.5,
      height: 1,
      depth: 3,
    },
    // Twin wing engines
    engines: [
      {
        position: [-0.3, 0, 0.6],
        scale: 1.2,
        color: '#00aaff'
      },
      {
        position: [0.3, 0, 0.6],
        scale: 1.2,
        color: '#00aaff'
      },
    ],
  },
};

// Default ship when no selection made
export const DEFAULT_SHIP_ID: ShipId = 'guardians-ship';

// Helper to get config with fallback
export function getShipConfig(shipId: ShipId): ShipConfig {
  return SHIP_CONFIGS[shipId] ?? SHIP_CONFIGS[DEFAULT_SHIP_ID];
}
