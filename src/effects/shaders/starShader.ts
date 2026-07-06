/**
 * Star Shader - GLSL shaders for the streaming star field
 *
 * Renders each star as a soft round sprite (not the square quads of
 * PointsMaterial) with:
 * - Size attenuated by depth (distant stars are smaller)
 * - Per-star twinkle: a seed offsets a time-based sine wave so stars
 *   shimmer independently
 * - Per-star color: mixed between white and the theme star color
 */

export const starVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;

  uniform float uTime;
  uniform float uTwinkleSpeed;
  uniform float uBrightness;

  varying float vAlpha;
  varying float vSeed;

  void main() {
    vSeed = aSeed;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Independent shimmer per star via seed phase offset
    float twinkle = 0.7 + 0.3 * sin(uTime * uTwinkleSpeed + aSeed * 6.2831);
    vAlpha = uBrightness * twinkle;

    gl_PointSize = aSize * (100.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const starFragmentShader = /* glsl */ `
  uniform vec3 uColor;

  varying float vAlpha;
  varying float vSeed;

  void main() {
    // Soft round sprite
    vec2 centered = gl_PointCoord - 0.5;
    float dist = length(centered) * 2.0;
    float sprite = 1.0 - smoothstep(0.3, 1.0, dist);
    if (sprite < 0.01) discard;

    // Vary star color between white-hot and the warm theme color
    vec3 color = mix(vec3(1.0), uColor, vSeed * 0.75);

    gl_FragColor = vec4(color, vAlpha * sprite);
  }
`;
