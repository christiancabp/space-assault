/**
 * EnginePropulsion - Animated engine exhaust flame effect
 *
 * Creates a realistic-looking engine flame using custom shaders with:
 * - Animated noise-based flickering
 * - Color gradient from hot core to white tip
 * - Soft alpha edges
 * - Additive blending for glow effect
 *
 * Usage:
 * <EnginePropulsion position={[0, 0, 1]} scale={1} coreColor="#ff6600" />
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { flameVertexShader, flameFragmentShader } from './shaders/flameShader';

interface EnginePropulsionProps {
  position: [number, number, number];
  scale?: number;
  coreColor?: string;
  outerColor?: string;
  intensity?: number;
  length?: number;
}

// Convert hex color to THREE.Color
function hexToVec3(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

export function EnginePropulsion({
  position,
  scale = 1,
  coreColor = '#ff6600',
  outerColor = '#ff3300',
  intensity = 1.2,
  length = 1,
}: EnginePropulsionProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);

  // Create material with useMemo
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCoreColor: { value: hexToVec3(coreColor) },
        uOuterColor: { value: hexToVec3(outerColor) },
        uIntensity: { value: intensity },
      },
      vertexShader: flameVertexShader,
      fragmentShader: flameFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, [coreColor, outerColor, intensity]);

  // Animate the flame - update uniforms through mesh material
  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // Flame geometry - cone pointing backward (positive Z in ship space).
  // Keep the geometry at unit size and scale the group instead: the flame
  // shader's shape/falloff constants assume these local dimensions, so baking
  // scale into the geometry makes the flame fade out (invisible at scale ≳ 1.5).
  const flameLength = 0.8 * length;
  const flameRadius = 0.25;

  return (
    <group position={position} scale={scale}>
      {/* Main flame cone */}
      <mesh
        ref={meshRef}
        material={material}
        rotation={[Math.PI / 2, 0, 0]} // Point toward +Z (behind ship)
      >
        <coneGeometry args={[flameRadius, flameLength, 16, 8, true]} />
      </mesh>

      {/* Inner bright core - smaller, brighter */}
      <mesh
        ref={innerMeshRef}
        material={material}
        rotation={[Math.PI / 2, 0, 0]} // Point toward +Z (behind ship)
        scale={[0.5, 0.6, 0.5]}
      >
        <coneGeometry args={[flameRadius, flameLength, 12, 6, true]} />
      </mesh>

      {/* Point light for glow effect */}
      <pointLight
        color={coreColor}
        intensity={intensity * 0.5}
        distance={3 * scale}
        decay={2}
      />
    </group>
  );
}
