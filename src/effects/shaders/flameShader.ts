/**
 * Flame Shader - GLSL shaders for engine propulsion effect
 *
 * Creates an animated flame effect with:
 * - Simplex noise for organic flickering
 * - Color gradient from core to tip
 * - Soft alpha falloff at edges
 * - Time-based animation
 */

export const flameVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;

  void main() {
    vUv = uv;
    vPosition = position;

    vec3 pos = position;

    // Slight wobble for organic movement
    float wobble = sin(pos.y * 8.0 + uTime * 4.0) * 0.03;
    wobble += sin(pos.y * 12.0 - uTime * 3.0) * 0.02;
    pos.x += wobble;
    pos.z += wobble * 0.5;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const flameFragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  uniform vec3 uCoreColor;
  uniform vec3 uOuterColor;
  uniform float uIntensity;

  //
  // Simplex 3D Noise
  // by Ian McEwan, Ashima Arts
  //
  vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    // Permutations
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    // Use actual 3D position for radial distance (works properly with cone geometry)
    float radialDist = length(vPosition.xz) * 4.0; // Distance from center axis

    // Gradient along flame length (0 at base, 1 at tip) - use Y position normalized
    float lengthGradient = clamp(vPosition.y + 0.5, 0.0, 1.0);

    // Multi-octave noise for organic flickering (use 3D position for proper wrapping)
    float noise1 = snoise(vec3(vPosition.xz * 8.0, uTime * 2.5 + vPosition.y * 2.0)) * 0.5 + 0.5;
    float noise2 = snoise(vec3(vPosition.xz * 16.0, uTime * 4.0 + vPosition.y * 4.0)) * 0.3 + 0.5;
    float noise = noise1 * 0.7 + noise2 * 0.3;

    // Flame shape - tapers toward tip
    float flameShape = 1.0 - smoothstep(0.0, 0.5 + noise * 0.2, radialDist);
    flameShape *= 1.0 - smoothstep(0.6, 1.0, lengthGradient + noise * 0.15);

    // Color gradient: core (hot) -> outer -> white tip
    vec3 coreHot = uCoreColor * 1.5; // Brighter core
    vec3 midColor = mix(uCoreColor, uOuterColor, 0.5);
    vec3 tipColor = vec3(1.0, 1.0, 1.0); // White tip

    // Interpolate colors based on position
    vec3 color = mix(coreHot, midColor, lengthGradient * 0.6);
    color = mix(color, uOuterColor, lengthGradient * 0.8);
    color = mix(color, tipColor, pow(lengthGradient, 2.0) * 0.7);

    // Add some variation based on radial distance
    color = mix(coreHot, color, radialDist * 1.5);

    // Brightness boost at core
    float coreBrightness = 1.0 - radialDist * 0.5;
    color *= coreBrightness;

    // Final alpha with noise variation
    float alpha = flameShape * noise * uIntensity;
    alpha *= 1.0 - lengthGradient * 0.3; // Fade toward tip

    // Smooth edges
    alpha = smoothstep(0.0, 0.1, alpha);

    gl_FragColor = vec4(color * uIntensity, alpha);
  }
`;
