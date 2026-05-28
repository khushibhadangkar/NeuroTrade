"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import type { ChartData, CandleData } from "./chartData";

interface CandlestickCanvasProps {
  data: ChartData;
  zoom: number;
  showPrediction: boolean;
  showMA: boolean;
  onHoverCandle: (candle: CandleData | null) => void;
}

/**
 * High-performance candlestick chart rendered on HTML5 Canvas.
 * Features:
 * - Animated candle entrance
 * - AI prediction trail with confidence zone (gradient fill)
 * - Moving average overlays
 * - Crosshair on hover
 * - Smooth zoom transitions
 */
export function CandlestickCanvas({
  data,
  zoom,
  showPrediction,
  showMA,
  onHoverCandle,
}: CandlestickCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animProgress = useRef(0);
  const animFrame = useRef(0);
  const mousePos = useRef<{ x: number; y: number } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    ctx.clearRect(0, 0, W, H);

    const { candles, prediction, ma } = data;
    if (!candles.length) return;

    // Price range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const c of candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }
    if (showPrediction) {
      for (const p of prediction) {
        if (p.lower < minPrice) minPrice = p.lower;
        if (p.upper > maxPrice) maxPrice = p.upper;
      }
    }
    const priceRange = maxPrice - minPrice || 1;
    const pricePad = priceRange * 0.08;
    minPrice -= pricePad;
    maxPrice += pricePad;
    const totalRange = maxPrice - minPrice;

    const toY = (price: number) =>
      padding.top + chartH * (1 - (price - minPrice) / totalRange);
    const toX = (i: number) =>
      padding.left + (i / (candles.length - 1)) * chartW;

    // Visible candles based on zoom
    const visibleCount = Math.floor(candles.length / zoom);
    const startIdx = Math.max(0, candles.length - visibleCount);
    const visibleCandles = candles.slice(startIdx);

    const candleToX = (i: number) =>
      padding.left + (i / (visibleCandles.length - 1 || 1)) * chartW;

    // ─── Grid lines ───────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(244, 239, 229, 0.04)";
    ctx.lineWidth = 0.5;
    const gridLines = 6;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();

      // Price labels
      const price = maxPrice - (totalRange / gridLines) * i;
      ctx.fillStyle = "rgba(156, 149, 136, 0.7)";
      ctx.font = "10px var(--font-jetbrains), monospace";
      ctx.textAlign = "left";
      ctx.fillText(`$${price.toFixed(1)}`, W - padding.right + 8, y + 3);
    }

    // ─── Prediction zone boundary ─────────────────────────────────────
    const predStartIdx = visibleCandles.findIndex((c) => c.isPrediction);
    if (showPrediction && predStartIdx > 0) {
      const predX = candleToX(predStartIdx);

      // Dashed vertical line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(183, 155, 98, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(predX, padding.top);
      ctx.lineTo(predX, padding.top + chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = "rgba(183, 155, 98, 0.7)";
      ctx.font = "bold 9px var(--font-inter), sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("AI FORECAST ZONE", predX + 50, padding.top + 12);

      // Confidence band (gradient fill)
      if (prediction.length > 1) {
        const predCandles = visibleCandles.filter((c) => c.isPrediction);
        const bandStartX = candleToX(predStartIdx);
        const bandWidth = chartW - bandStartX + padding.left;

        ctx.save();
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        gradient.addColorStop(0, "rgba(183, 155, 98, 0.06)");
        gradient.addColorStop(0.5, "rgba(183, 155, 98, 0.03)");
        gradient.addColorStop(1, "rgba(183, 155, 98, 0.06)");

        ctx.fillStyle = gradient;
        ctx.beginPath();

        // Upper band
        for (let i = 0; i < prediction.length; i++) {
          const x = bandStartX + (i / (prediction.length - 1)) * (chartW - (bandStartX - padding.left));
          const y = toY(prediction[i].upper);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        // Lower band (reverse)
        for (let i = prediction.length - 1; i >= 0; i--) {
          const x = bandStartX + (i / (prediction.length - 1)) * (chartW - (bandStartX - padding.left));
          const y = toY(prediction[i].lower);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Prediction line
        ctx.strokeStyle = "rgba(183, 155, 98, 0.9)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(183, 155, 98, 0.4)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i < prediction.length; i++) {
          const x = bandStartX + (i / (prediction.length - 1)) * (chartW - (bandStartX - padding.left));
          const y = toY(prediction[i].value);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Prediction endpoint glow
        const lastPred = prediction[prediction.length - 1];
        const endX = bandStartX + (chartW - (bandStartX - padding.left));
        const endY = toY(lastPred.value);
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(183, 155, 98, 0.9)";
        ctx.shadowColor = "rgba(183, 155, 98, 0.6)";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // ─── Moving averages ──────────────────────────────────────────────
    if (showMA && ma.length > 0) {
      const maSlice = ma.slice(startIdx);

      // MA 20
      ctx.strokeStyle = "rgba(122, 155, 168, 0.6)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < maSlice.length; i++) {
        const x = candleToX(i);
        const y = toY(maSlice[i].ma20);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // MA 50
      ctx.strokeStyle = "rgba(183, 155, 98, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (let i = 0; i < maSlice.length; i++) {
        const x = candleToX(i);
        const y = toY(maSlice[i].ma50);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ─── Candlesticks ─────────────────────────────────────────────────
    const candleWidth = Math.max(2, (chartW / visibleCandles.length) * 0.6);
    const animatedCount = Math.floor(visibleCandles.length * Math.min(animProgress.current, 1));

    for (let i = 0; i < animatedCount; i++) {
      const candle = visibleCandles[i];
      const x = candleToX(i);
      const isGreen = candle.close >= candle.open;
      const isPred = candle.isPrediction;

      const bodyTop = toY(Math.max(candle.open, candle.close));
      const bodyBottom = toY(Math.min(candle.open, candle.close));
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);

      // Wick
      ctx.strokeStyle = isPred
        ? "rgba(183, 155, 98, 0.5)"
        : isGreen
        ? "rgba(127, 154, 130, 0.6)"
        : "rgba(192, 97, 74, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(candle.high));
      ctx.lineTo(x, toY(candle.low));
      ctx.stroke();

      // Body
      if (isPred) {
        ctx.fillStyle = isGreen
          ? "rgba(183, 155, 98, 0.7)"
          : "rgba(183, 155, 98, 0.4)";
        ctx.strokeStyle = "rgba(183, 155, 98, 0.9)";
      } else {
        ctx.fillStyle = isGreen
          ? "rgba(127, 154, 130, 0.8)"
          : "rgba(192, 97, 74, 0.8)";
        ctx.strokeStyle = isGreen
          ? "rgba(127, 154, 130, 1)"
          : "rgba(192, 97, 74, 1)";
      }

      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

      // Glow for prediction candles
      if (isPred) {
        ctx.shadowColor = "rgba(183, 155, 98, 0.3)";
        ctx.shadowBlur = 6;
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
        ctx.shadowBlur = 0;
      }
    }

    // ─── Crosshair ────────────────────────────────────────────────────
    if (mousePos.current) {
      const mx = mousePos.current.x;
      const my = mousePos.current.y;

      if (mx > padding.left && mx < W - padding.right && my > padding.top && my < padding.top + chartH) {
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = "rgba(244, 239, 229, 0.2)";
        ctx.lineWidth = 0.5;

        // Vertical
        ctx.beginPath();
        ctx.moveTo(mx, padding.top);
        ctx.lineTo(mx, padding.top + chartH);
        ctx.stroke();

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(padding.left, my);
        ctx.lineTo(W - padding.right, my);
        ctx.stroke();

        ctx.setLineDash([]);

        // Price label at crosshair
        const hoverPrice = maxPrice - ((my - padding.top) / chartH) * totalRange;
        ctx.fillStyle = "rgba(13, 12, 11, 0.9)";
        ctx.fillRect(W - padding.right + 2, my - 9, 55, 18);
        ctx.strokeStyle = "rgba(183, 155, 98, 0.5)";
        ctx.strokeRect(W - padding.right + 2, my - 9, 55, 18);
        ctx.fillStyle = "#f4efe5";
        ctx.font = "10px var(--font-jetbrains), monospace";
        ctx.textAlign = "left";
        ctx.fillText(`$${hoverPrice.toFixed(2)}`, W - padding.right + 6, my + 3);
      }
    }

    // ─── Date labels ──────────────────────────────────────────────────
    ctx.fillStyle = "rgba(156, 149, 136, 0.6)";
    ctx.font = "9px var(--font-inter), sans-serif";
    ctx.textAlign = "center";
    const labelInterval = Math.max(1, Math.floor(visibleCandles.length / 8));
    for (let i = 0; i < visibleCandles.length; i += labelInterval) {
      const x = candleToX(i);
      ctx.fillText(visibleCandles[i].date, x, H - 8);
    }
  }, [data, zoom, showPrediction, showMA]);

  // Animation loop
  useEffect(() => {
    animProgress.current = 0;
    const startTime = performance.now();
    const duration = 1200;

    const animate = (now: number) => {
      animProgress.current = Math.min((now - startTime) / duration, 1);
      draw();
      if (animProgress.current < 1) {
        animFrame.current = requestAnimationFrame(animate);
      }
    };

    animFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame.current);
  }, [draw, data]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  // Mouse tracking
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      // Find hovered candle
      const visibleCount = Math.floor(data.candles.length / zoom);
      const startIdx = Math.max(0, data.candles.length - visibleCount);
      const visibleCandles = data.candles.slice(startIdx);
      const chartW = rect.width - 70;
      const relX = mousePos.current.x - 10;
      const idx = Math.round((relX / chartW) * (visibleCandles.length - 1));
      if (idx >= 0 && idx < visibleCandles.length) {
        onHoverCandle(visibleCandles[idx]);
      }

      draw();
    },
    [data, zoom, draw, onHoverCandle]
  );

  const handleMouseLeave = useCallback(() => {
    mousePos.current = null;
    onHoverCandle(null);
    draw();
  }, [draw, onHoverCandle]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ pointerEvents: "auto" }}
      />
    </div>
  );
}
