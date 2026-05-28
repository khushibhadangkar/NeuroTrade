"use client";

import { useRef, useEffect, useCallback } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
  pulseSpeed: number;
  layer: number;
}

interface Connection {
  from: number;
  to: number;
  strength: number;
  pulseOffset: number;
}

/**
 * Animated neural network canvas — nodes drift slowly, connections
 * pulse with data-flow animations, creating a living AI atmosphere.
 */
export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const timeRef = useRef(0);

  const initNetwork = useCallback((width: number, height: number) => {
    const nodeCount = Math.min(Math.floor((width * height) / 25000), 60);
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        layer: Math.floor(Math.random() * 3),
      });
    }

    // Create connections between nearby nodes
    const connections: Connection[] = [];
    const maxDist = Math.min(width, height) * 0.2;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist && Math.random() > 0.6) {
          connections.push({
            from: i,
            to: j,
            strength: 1 - dist / maxDist,
            pulseOffset: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    nodesRef.current = nodes;
    connectionsRef.current = connections;
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    timeRef.current += 0.016;
    const t = timeRef.current;

    ctx.clearRect(0, 0, width, height);

    const nodes = nodesRef.current;
    const connections = connectionsRef.current;

    // Update node positions
    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;

      // Soft boundary bounce
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;

      node.x = Math.max(0, Math.min(width, node.x));
      node.y = Math.max(0, Math.min(height, node.y));
    }

    // Draw connections with pulsing data flow
    for (const conn of connections) {
      const from = nodes[conn.from];
      const to = nodes[conn.to];
      const pulse = Math.sin(t * 2 + conn.pulseOffset) * 0.5 + 0.5;
      const alpha = conn.strength * 0.12 * (0.5 + pulse * 0.5);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = `rgba(183, 155, 98, ${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Data pulse dot traveling along the connection
      if (pulse > 0.7) {
        const progress = (Math.sin(t * 3 + conn.pulseOffset) * 0.5 + 0.5);
        const px = from.x + (to.x - from.x) * progress;
        const py = from.y + (to.y - from.y) * progress;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(183, 155, 98, ${alpha * 3})`;
        ctx.fill();
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const pulse = Math.sin(t * node.pulseSpeed * 60 + node.pulsePhase) * 0.5 + 0.5;
      const alpha = 0.3 + pulse * 0.4;
      const r = node.radius * (1 + pulse * 0.3);

      // Outer glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(183, 155, 98, ${alpha * 0.08})`;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle =
        node.layer === 0
          ? `rgba(183, 155, 98, ${alpha})`
          : node.layer === 1
          ? `rgba(127, 154, 130, ${alpha * 0.7})`
          : `rgba(122, 155, 168, ${alpha * 0.5})`;
      ctx.fill();
    }

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      initNetwork(window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener("resize", resize);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [animate, initNetwork]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 opacity-60"
      aria-hidden="true"
    />
  );
}
