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
  PLAYER_SPEED: 12,                    // Units per second
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
    position: { x: 0, y: 8, z: 10 },  // Behind and above player
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
    stars: '#ffe65a',
  },

  // ============================================
  // STAR FIELD
  // ============================================
  STARS: {
    spread: { x: 80, y: 40, z: 100 },  // Star field dimensions
    resetZ: -100,                      // Where stars reset when passing camera
    despawnZ: 30,                      // When to reset stars
    twinkleSpeed: 3.5,                 // Per-star brightness oscillation rate
    // Parallax layers: far/slow/small behind near/fast/large
    layers: [
      { count: 650, speed: 16, sizeMin: 0.4, sizeMax: 1.0, brightness: 0.55 },
      { count: 300, speed: 32, sizeMin: 0.9, sizeMax: 2.2, brightness: 1.0 },
    ],
  },

  // ============================================
  // EXPLOSIONS
  // ============================================
  EXPLOSIONS: {
    particleCount: 60,                 // Particles per burst (pool size)
    lifetime: 0.7,                     // Seconds until burst is removed
    speedMin: 4,                       // Particle radial speed range
    speedMax: 14,
    sizeMin: 6,                        // Point size range (screen-space px at ref depth)
    sizeMax: 16,
    coreColor: '#fff3c0',              // Hot center flash
    drag: 2.5,                         // Velocity damping over life
  },

  // ============================================
  // SCREEN SHAKE (trauma-based: shake = trauma²)
  // ============================================
  SCREEN_SHAKE: {
    maxOffset: 0.45,                   // Max positional shake (units) at trauma=1
    maxRoll: 0.06,                     // Max camera roll (radians) at trauma=1
    frequency: 22,                     // Shake oscillation speed
    decayPerSecond: 1.4,               // Trauma lost per second
    traumaPerKill: 0.22,               // Added when a bullet destroys an enemy
    traumaPerHit: 0.6,                 // Added when the player is hit
  },

  // ============================================
  // AUDIO
  // ============================================
  AUDIO: {
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.45,
    pauseDuck: 0.3,                    // Music volume multiplier while paused
    pitchVariance: 0.12,               // ± random playback-rate variation on SFX
  },

  // ============================================
  // BLOOM POST-PROCESSING
  // ============================================
  BLOOM: {
    intensity: 2.5,
    luminanceThreshold: 0.4,           // Only colors brighter than this glow
    luminanceSmoothing: 0.25,
    mipmapBlur: true,
  },
} as const;

// Type helper for accessing config
export type GameConfig = typeof GAME_CONFIG;
