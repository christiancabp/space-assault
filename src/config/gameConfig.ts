/**
 * Game Configuration Constants
 *
 * All tunable game parameters in one place.
 * Adjust these values to balance gameplay.
 */

export const GAME_CONFIG = {
  // ============================================
  // PLAYER SETTINGS
  // ============================================
  PLAYER_SPEED: 10,                    // Units per second
  PLAYER_START_LIVES: 3,
  PLAYER_Z: 0,                         // Player's fixed Z position

  // Player movement boundaries (X and Y)
  PLAYER_BOUNDS: {
    minX: -10,
    maxX: 10,
    minY: 0.5,                         // Don't go below "ground"
    maxY: 8,                           // Don't go too high
  },

  // Ship tilt animation (roll/pitch when moving)
  PLAYER_TILT: {
    maxRoll: 0.5,                      // ~23 degrees max roll (Z-axis)
    maxPitch: 0.3,                    // ~14 degrees max pitch (X-axis)
    easeInSpeed: 12,                   // Fast snap into the roll
    easeOutSpeed: 3,                   // Slow ease back to neutral
  },

  // Double-tap barrel roll
  BARREL_ROLL: {
    doubleTapThreshold: 300,           // ms window to detect double-tap
    duration: 600,                     // ms for full 360° roll
    shiftDistance: 4,                  // units to shift left/right during roll
  },

  // ============================================
  // BULLET SETTINGS
  // ============================================
  BULLET_SPEED: 40,                    // Units per second (fast!)
  PLAYER_FIRE_RATE: 120,               // Milliseconds between shots
  BULLET_DESPAWN_Z: -50,               // Remove bullets past this Z

  // Bullet size (small cubes)
  BULLET_SIZE: { x: 0.1, y: 0.1, z: 0.4 },

  // ============================================
  // ENEMY SETTINGS
  // ============================================
  ENEMY_SPAWN_Z: -45,                  // Where enemies appear
  ENEMY_APPROACH_SPEED: 4,             // Slow approach (Galaga style)
  ENEMY_ATTACK_SPEED: 15,              // Fast dive attack
  ENEMY_SPAWN_INTERVAL: 1500,          // Milliseconds between spawns
  ENEMY_ATTACK_TRIGGER_Z: -12,         // Switch to attack phase at this Z

  // Enemy spawn X range (random position)
  ENEMY_SPAWN_X_RANGE: { min: -10, max: 10 },

  // Enemy spawn Y range (vertical variety)
  ENEMY_SPAWN_Y_RANGE: { min: 1, max: 6 },

  // Enemy size
  ENEMY_SIZE: { x: 1.2, y: 1.2, z: 1.2 },

  // ============================================
  // BOUNDARIES
  // ============================================
  DESPAWN_Z: 8,                        // Remove entities past player
  PLAY_AREA_DEPTH: 50,                 // Total playable depth

  // ============================================
  // SCORING
  // ============================================
  POINTS_PER_ENEMY: 100,

  // ============================================
  // CAMERA
  // ============================================
  CAMERA: {
    position: { x: 0, y: 6, z: 10 },  // Behind and above player
    fov: 70,                           // Field of view
    lookAt: { x: 0, y: 0, z: -15 },    // Look forward into play area
  },

  // ============================================
  // VISUAL / COLORS (Minimalist Sci-Fi)
  // ============================================
  COLORS: {
    player: '#ffffff',                 // White
    enemy: '#4a9eff',                  // Blue
    bullet: '#ff4444',                 // Red
    bulletEmissive: '#ff0000',
    stars: '#ffffff',
  },

  // ============================================
  // STAR FIELD
  // ============================================
  STARS: {
    count: 800,
    speed: 30,                         // How fast stars stream past
    spread: { x: 80, y: 40, z: 100 },  // Star field dimensions
    resetZ: -100,                      // Where stars reset when passing camera
    despawnZ: 25,                      // When to reset stars
  },
} as const;

// Type helper for accessing config
export type GameConfig = typeof GAME_CONFIG;
