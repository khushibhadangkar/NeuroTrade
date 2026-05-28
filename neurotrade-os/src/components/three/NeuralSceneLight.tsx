"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { NeuralNetwork } from "./NeuralNetwork";
import { AmbientGlow } from "./AmbientGlow";
import { SceneController } from "./SceneController";

/**
 * Lightweight version of the neural scene for use as a dashboard
 * background. Fewer nodes, no grid, lower DPR — designed to run
 * alongside heavy UI without frame drops.
 */
export function NeuralSceneLight({
  className = "",
  opacity = 0.4,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 14], fov: 55, near: 0.1, far: 80 }}
        dpr={[1, 1]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        frameloop="demand" // Only render when something changes
      >
        <Suspense fallback={null}>
          <SceneController mouseRadius={4} />
          <NeuralNetwork count={50} connectionDistance={3.5} />
          <AmbientGlow />
        </Suspense>
      </Canvas>
    </div>
  );
}
