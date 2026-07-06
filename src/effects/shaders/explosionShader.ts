/**
 * Explosion Shader - GLSL shaders for particle burst effect
 *
 * Renders a Points burst where each particle:
 * - Flies outward with damped radial velocity (integrated in the vertex shader,
 *   so particle motion costs zero CPU per frame)
 * - Shrinks and fades over the burst's lifetime
 * - Starts as a hot core flash and cools to the destroyed entity's color
 *
 * Colors are multiplied above 1.0 so bloom picks up the burst.
 */

export const explosionVertexShader = /* glsl */ `
  attribute vec3 aVelocity;
  attribute float aSize;
  attribute float aSeed;

  uniform float uProgress;  // 0 at spawn, 1 at end of lifetime
  uniform float uLifetime;  // Seconds
  uniform float uDrag;      // Velocity damping

  varying float vSeed;

  void main() {
    vSeed = aSeed;

    // Damped outward motion: closed-form integral of v * exp(-drag * t)
    float t = uProgress * uLifetime;
    vec3 displaced = position + aVelocity * (1.0 - exp(-uDrag * t)) / uDrag;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);

    // Shrink over life, attenuate by depth
    float fade = 1.0 - uProgress;
    gl_PointSize = aSize * fade * (120.0 / -mvPosition.z);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const explosionFragmentShader = /* glsl */ `
  uniform vec3 uColor;      // Outer color (destroyed entity's color)
  uniform vec3 uCoreColor;  // Hot flash color
  uniform float uProgress;

  varying float vSeed;

  void main() {
    // Soft round sprite from the point's UV
    vec2 centered = gl_PointCoord - 0.5;
    float dist = length(centered) * 2.0;
    float sprite = 1.0 - smoothstep(0.4, 1.0, dist);

    // Hot core early in life, cooling to the entity color (per-particle offset via seed)
    float heat = clamp(uProgress * 2.2 + vSeed * 0.4, 0.0, 1.0);
    vec3 color = mix(uCoreColor, uColor, heat);

    // Quadratic fade-out; boost brightness past the bloom threshold
    float alpha = sprite * (1.0 - uProgress) * (1.0 - uProgress);
    gl_FragColor = vec4(color * 2.0, alpha);
  }
`;
