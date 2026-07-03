"use client";

import { useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mouseState } from "./SceneController";

// ─── Shaders ──────────────────────────────────────────────────────────────

const nodeVertexShader = `
  attribute float aPhase;
  attribute float aLayer;
  attribute float aSize;
  
  varying float vAlpha;
  varying float vLayer;
  
  uniform float uTime;
  
  void main() {
    vLayer = aLayer;
    
    // Pulse based on phase
    float pulse = sin(uTime * 1.5 + aPhase) * 0.5 + 0.5;
    vAlpha = 0.4 + pulse * 0.6;
    
    // Size variation with pulse
    float size = aSize * (1.0 + pulse * 0.4);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const nodeFragmentShader = `
  varying float vAlpha;
  varying float vLayer;
  
  void main() {
    // Circular point with soft edge
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float softEdge = 1.0 - smoothstep(0.2, 0.5, dist);
    
    // Color based on layer
    vec3 color;
    if (vLayer < 0.33) {
      color = vec3(0.718, 0.608, 0.384); // amber
    } else if (vLayer < 0.66) {
      color = vec3(0.498, 0.604, 0.510); // mint
    } else {
      color = vec3(0.478, 0.608, 0.659); // cyan
    }
    
    // Glow falloff
    float glow = exp(-dist * 4.0) * 0.6;
    
    gl_FragColor = vec4(color, (softEdge + glow) * vAlpha);
  }
`;

const lineVertexShader = `
  attribute float aAlpha;
  varying float vAlpha;
  
  void main() {
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const lineFragmentShader = `
  varying float vAlpha;
  uniform float uTime;
  
  void main() {
    vec3 color = vec3(0.718, 0.608, 0.384); // amber
    gl_FragColor = vec4(color, vAlpha * 0.25);
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────

interface NodeData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  basePosition: THREE.Vector3;
  phase: number;
  layer: number;
  size: number;
}

// ─── Component ────────────────────────────────────────────────────────────

interface NeuralNetworkProps {
  count: number;
  connectionDistance: number;
}

export function NeuralNetwork({ count, connectionDistance }: NeuralNetworkProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const timeRef = useRef(0);

  // Generate initial node data
  const nodes = useMemo<NodeData[]>(() => {
    const result: NodeData[] = [];
    for (let i = 0; i < count; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8
      );
      result.push({
        position: pos.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.004
        ),
        basePosition: pos.clone(),
        phase: Math.random() * Math.PI * 2,
        layer: Math.random(),
        size: 0.03 + Math.random() * 0.06,
      });
    }
    return result;
  }, [count]);

  // Points geometry attributes
  const { positions, phases, layers, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const layers = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = nodes[i].position.x;
      positions[i * 3 + 1] = nodes[i].position.y;
      positions[i * 3 + 2] = nodes[i].position.z;
      phases[i] = nodes[i].phase;
      layers[i] = nodes[i].layer;
      sizes[i] = nodes[i].size;
    }

    return { positions, phases, layers, sizes };
  }, [count, nodes]);

  // Line geometry — pre-allocate max possible connections
  const maxConnections = count * 6; // average ~6 connections per node max
  const linePositions = useMemo(() => new Float32Array(maxConnections * 6), [maxConnections]);
  const lineAlphas = useMemo(() => new Float32Array(maxConnections * 2), [maxConnections]);

  // Uniforms
  const nodeUniforms = useMemo(
    () => ({ uTime: { value: 0 } }),
    []
  );
  const lineUniforms = useMemo(
    () => ({ uTime: { value: 0 } }),
    []
  );

  // Animation loop
  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (!pointsRef.current || !linesRef.current) return;

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    // Update node positions
    for (let i = 0; i < count; i++) {
      const node = nodes[i];

      // Ambient drift
      node.position.x += node.velocity.x;
      node.position.y += node.velocity.y;
      node.position.z += node.velocity.z;

      // Soft return to base position
      node.position.x += (node.basePosition.x - node.position.x) * 0.001;
      node.position.y += (node.basePosition.y - node.position.y) * 0.001;
      node.position.z += (node.basePosition.z - node.position.z) * 0.001;

      // Boundary soft bounce
      if (Math.abs(node.position.x) > 9) node.velocity.x *= -0.8;
      if (Math.abs(node.position.y) > 6) node.velocity.y *= -0.8;
      if (Math.abs(node.position.z) > 5) node.velocity.z *= -0.8;

      // Mouse repulsion (in screen-projected space)
      const dx = node.position.x - mouseState.x;
      const dy = node.position.y - mouseState.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3 && dist > 0.01) {
        const force = (1 - dist / 3) * 0.02;
        node.position.x += (dx / dist) * force;
        node.position.y += (dy / dist) * force;
      }

      // Subtle sine wave motion
      node.position.y += Math.sin(t * 0.5 + node.phase) * 0.001;

      // Write to buffer
      posArray[i * 3] = node.position.x;
      posArray[i * 3 + 1] = node.position.y;
      posArray[i * 3 + 2] = node.position.z;
    }
    posAttr.needsUpdate = true;

    // Update connections
    const lineGeo = linesRef.current.geometry;
    const linePosAttr = lineGeo.attributes.position as THREE.BufferAttribute;
    const lineAlphaAttr = lineGeo.attributes.aAlpha as THREE.BufferAttribute;
    const linePosArray = linePosAttr.array as Float32Array;
    const lineAlphaArray = lineAlphaAttr.array as Float32Array;

    let connectionCount = 0;
    const maxDist = connectionDistance;
    const maxDistSq = maxDist * maxDist;

    for (let i = 0; i < count && connectionCount < maxConnections; i++) {
      for (let j = i + 1; j < count && connectionCount < maxConnections; j++) {
        const dx = nodes[i].position.x - nodes[j].position.x;
        const dy = nodes[i].position.y - nodes[j].position.y;
        const dz = nodes[i].position.z - nodes[j].position.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < maxDistSq) {
          const dist = Math.sqrt(distSq);
          const alpha = (1 - dist / maxDist) * 0.6;

          const idx = connectionCount * 6;
          linePosArray[idx] = nodes[i].position.x;
          linePosArray[idx + 1] = nodes[i].position.y;
          linePosArray[idx + 2] = nodes[i].position.z;
          linePosArray[idx + 3] = nodes[j].position.x;
          linePosArray[idx + 4] = nodes[j].position.y;
          linePosArray[idx + 5] = nodes[j].position.z;

          const alphaIdx = connectionCount * 2;
          lineAlphaArray[alphaIdx] = alpha;
          lineAlphaArray[alphaIdx + 1] = alpha;

          connectionCount++;
        }
      }
    }

    // Zero out unused connections
    for (let i = connectionCount * 6; i < linePosArray.length; i++) {
      linePosArray[i] = 0;
    }
    for (let i = connectionCount * 2; i < lineAlphaArray.length; i++) {
      lineAlphaArray[i] = 0;
    }

    linePosAttr.needsUpdate = true;
    lineAlphaAttr.needsUpdate = true;
    lineGeo.setDrawRange(0, connectionCount * 2);

    // Update uniforms
    nodeUniforms.uTime.value = t;
    lineUniforms.uTime.value = t;
  });

  return (
    <group>
      {/* Neural nodes — rendered as shader points */}
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
            attach="attributes-aLayer"
            count={count}
            array={layers}
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
          vertexShader={nodeVertexShader}
          fragmentShader={nodeFragmentShader}
          uniforms={nodeUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Connection lines */}
      <lineSegments ref={linesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={maxConnections * 2}
            array={linePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aAlpha"
            count={maxConnections * 2}
            array={lineAlphas}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={lineVertexShader}
          fragmentShader={lineFragmentShader}
          uniforms={lineUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}
