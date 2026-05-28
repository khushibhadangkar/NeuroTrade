"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Shaders ──────────────────────────────────────────────────────────────

const gridVertexShader = `
  varying vec2 vUv;
  varying float vFade;
  
  void main() {
    vUv = uv;
    
    // Fade based on distance from center
    float dist = length(position.xz) / 12.0;
    vFade = 1.0 - smoothstep(0.3, 1.0, dist);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const gridFragmentShader = `
  varying vec2 vUv;
  varying float vFade;
  
  uniform float uTime;
  
  void main() {
    vec2 uv = vUv * 24.0; // Grid density
    
    // Grid lines
    vec2 grid = abs(fract(uv - 0.5) - 0.5) / fwidth(uv);
    float line = min(grid.x, grid.y);
    float gridAlpha = 1.0 - min(line, 1.0);
    
    // Pulse wave radiating from center
    float dist = length(vUv - 0.5) * 2.0;
    float pulse = sin(dist * 8.0 - uTime * 0.8) * 0.5 + 0.5;
    pulse = smoothstep(0.4, 0.6, pulse) * 0.3;
    
    // Combine
    float alpha = gridAlpha * 0.08 + pulse * 0.04;
    alpha *= vFade;
    
    vec3 color = vec3(0.718, 0.608, 0.384); // amber
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Market grid floor — a subtle perspective grid with pulsing waves
 * that creates depth and a "data processing" atmosphere.
 */
export function MarketGrid() {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -4, 0]}
      frustumCulled={false}
    >
      <planeGeometry args={[24, 24, 1, 1]} />
      <shaderMaterial
        vertexShader={gridVertexShader}
        fragmentShader={gridFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
