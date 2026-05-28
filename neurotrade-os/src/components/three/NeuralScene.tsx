"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { NeuralNetwork } from "./NeuralNetwork";
import { MarketGrid } from "./MarketGrid";
import { AmbientGlow } from "./AmbientGlow";
import { DataPulses } from "./DataPulses";
import { SceneController } from "./SceneController";

interface NeuralSceneProps {
  /** Number of neural nodes (default 120) */
  nodeCount?: number;
  /** Connection distance threshold (default 2.8) */
  connectionDistance?: number;
  /** Mouse influence radius (default 3) */
  mouseRadius?: number;
  /** Overall opacity (default 1) */
  opacity?: number;
  /** CSS class for the container */
  className?: string;
}

/**
 * React Three Fiber neural network scene.
 *
 * Renders an animated particle network with:
 * - Glowing nodes that pulse at different frequencies
 * - Connecting lines between nearby nodes
 * - Mouse-reactive displacement
 * - Ambient market grid floor
 * - Depth-of-field atmosphere
 *
 * Performance optimized:
 * - InstancedMesh for nodes (single draw call)
 * - BufferGeometry lines (no individual meshes)
 * - Frame-rate adaptive animation via useFrame delta
 * - Frustum culling disabled for always-visible particles
 */
export function NeuralScene({
  nodeCount = 120,
  connectionDistance = 2.8,
  mouseRadius = 3,
  opacity = 1,
  className = "",
}: NeuralSceneProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60, near: 0.1, far: 100 }}
        dpr={[1, 1.5]} // Cap pixel ratio for performance
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <SceneController mouseRadius={mouseRadius} />
          <ambientLight intensity={0.1} />
          <NeuralNetwork
            count={nodeCount}
            connectionDistance={connectionDistance}
          />
          <DataPulses count={40} />
          <MarketGrid />
          <AmbientGlow />
        </Suspense>
      </Canvas>
    </div>
  );
}
