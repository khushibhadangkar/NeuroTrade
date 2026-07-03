"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Shaders ──────────────────────────────────────────────────────────────

const pulseVertexShader = `
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aSize;
  
  varying float vAlpha;
  
  uniform float uTime;
  
  void main() {
    // Pulse lifecycle
    float t = fract(uTime * aSpeed + aPhase);
    vAlpha = sin(t * 3.14159) * 0.9; // fade in/out over lifecycle
    
    float size = aSize * vAlpha;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const pulseFragmentShader = `
  varying float vAlpha;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float glow = exp(-dist * 6.0);
    vec3 color = vec3(0.83, 0.73, 0.48); // bright amber
    
    gl_FragColor = vec4(color, glow * vAlpha);
  }
`;

/**
 * Data pulses — bright points that appear and fade at random positions,
 * simulating data packets being processed across the neural network.
 */
export function DataPulses({ count = 40 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, phases, speeds, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      phases[i] = Math.random();
      speeds[i] = 0.1 + Math.random() * 0.3;
      sizes[i] = 0.04 + Math.random() * 0.08;
    }

    return { positions, phases, speeds, sizes };
  }, [count]);

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          count={count}
          array={phases}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSpeed"
          count={count}
          array={speeds}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={pulseVertexShader}
        fragmentShader={pulseFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
