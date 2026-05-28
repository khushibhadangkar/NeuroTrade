"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Shared scene state — tracks normalized mouse position and provides
 * it to child components via a ref-based approach (no re-renders).
 *
 * Also handles subtle camera parallax based on mouse position.
 */

// Global mouse state accessible by all scene components
export const mouseState = {
  x: 0,
  y: 0,
  normalizedX: 0,
  normalizedY: 0,
};

interface SceneControllerProps {
  mouseRadius: number;
}

export function SceneController({ mouseRadius }: SceneControllerProps) {
  const { camera, size } = useThree();
  const targetCameraPos = useRef(new THREE.Vector3(0, 0, 12));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalized -1 to 1
      mouseState.normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseState.normalizedY = -(e.clientY / window.innerHeight) * 2 + 1;
      // World-space approximate position
      mouseState.x = mouseState.normalizedX * 8;
      mouseState.y = mouseState.normalizedY * 5;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Subtle camera parallax
  useFrame((_, delta) => {
    targetCameraPos.current.x = mouseState.normalizedX * 0.5;
    targetCameraPos.current.y = mouseState.normalizedY * 0.3;

    camera.position.x += (targetCameraPos.current.x - camera.position.x) * delta * 1.5;
    camera.position.y += (targetCameraPos.current.y - camera.position.y) * delta * 1.5;
    camera.lookAt(0, 0, 0);
  });

  return null;
}
