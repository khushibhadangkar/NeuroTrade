"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Shaders ──────────────────────────────────────────────────────────────

const glowVertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  
  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);
    
    // Primary amber glow
    float glow1 = exp(-dist * 3.0) * 0.15;
    
    // Secondary pulsing glow
    float pulse = sin(uTime * 0.5) * 0.5 + 0.5;
    float glow2 = exp(-dist * 4.0) * pulse * 0.08;
    
    // Offset mint glow
    vec2 offset = center - vec2(0.2, -0.1);
    float dist2 = length(offset);
    float glow3 = exp(-dist2 * 5.0) * 0.06;
    
    vec3 amber = vec3(0.718, 0.608, 0.384);
    vec3 mint = vec3(0.498, 0.604, 0.510);
    
    vec3 color = amber * (glow1 + glow2) + mint * glow3;
    float alpha = glow1 + glow2 + glow3;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Ambient volumetric glow — a large billboard quad behind the network
 * that provides atmospheric depth with pulsing amber/mint light.
 */
export function AmbientGlow() {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -6]} frustumCulled={false}>
      <planeGeometry args={[20, 14, 1, 1]} />
      <shaderMaterial
        vertexShader={glowVertexShader}
        fragmentShader={glowFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
