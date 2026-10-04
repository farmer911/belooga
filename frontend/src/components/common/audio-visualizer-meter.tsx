"use client";

import * as React from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AudioVisualizerMeterProps {
  /** Real audio stream to visualize */
  stream?: MediaStream | null;
  /** Optional existing AnalyserNode if managed externally */
  analyser?: AnalyserNode | null;
  /** Whether the visualization is active */
  isActive?: boolean;
  /** Number of VU meter bars (default: 5) */
  barCount?: number;
  /** Meter width in CSS pixels (default: 48) */
  width?: number;
  /** Meter height in CSS pixels (default: 16) */
  height?: number;
  /** Whether to show a mic icon alongside the canvas (default: true) */
  showIcon?: boolean;
  /** Custom wrapper className */
  className?: string;
}

export function AudioVisualizerMeter({
  stream,
  analyser: externalAnalyser,
  isActive = true,
  barCount = 5,
  width = 48,
  height = 16,
  showIcon = true,
  className,
}: AudioVisualizerMeterProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = React.useRef<number | null>(null);
  const internalAudioCtxRef = React.useRef<AudioContext | null>(null);
  const internalSourceRef = React.useRef<MediaStreamAudioSourceNode | null>(null);
  const iconRef = React.useRef<SVGSVGElement | null>(null);
  const hasAudioTrack = Boolean(
    stream && stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].enabled
  );

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle High-DPI screens
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    let activeAnalyser: AnalyserNode | null = externalAnalyser || null;

    // Set up internal Web Audio API pipeline if stream provided without analyser
    if (!activeAnalyser && stream && hasAudioTrack && isActive) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          internalAudioCtxRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);
          internalSourceRef.current = source;

          const analyserNode = audioCtx.createAnalyser();
          analyserNode.fftSize = 64;
          analyserNode.smoothingTimeConstant = 0.5;
          source.connect(analyserNode);

          activeAnalyser = analyserNode;
        }
      } catch {
        // Fallback gracefully if audio context cannot be initialized
      }
    }

    const dataArray = activeAnalyser
      ? new Uint8Array(activeAnalyser.frequencyBinCount)
      : new Uint8Array(0);

    let isRunning = true;

    const draw = () => {
      if (!isRunning) return;

      let level = 0;
      if (activeAnalyser && isActive && hasAudioTrack) {
        activeAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        const len = dataArray.length;
        for (let i = 0; i < len; i++) {
          sum += dataArray[i];
        }
        level = len > 0 ? (sum / len / 255) * 100 : 0;
      }

      // Update mic icon color via DOM ref without triggering React re-render
      if (iconRef.current) {
        if (level > 8) {
          iconRef.current.style.color = "#34d399"; // emerald-400
        } else {
          iconRef.current.style.color = "#94a3b8"; // slate-400
        }
      }

      // Render VU Meter Bars
      ctx.clearRect(0, 0, width, height);

      const spacing = 2;
      const totalSpacing = spacing * (barCount - 1);
      const barWidth = Math.max(2, (width - totalSpacing) / barCount);
      const thresholds = Array.from(
        { length: barCount },
        (_, i) => ((i + 1) / barCount) * 75
      );

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + spacing);
        const barHeight = height;
        const isActiveBar = isActive && hasAudioTrack && level >= thresholds[i];

        ctx.beginPath();
        // Draw rounded capsule bar
        const radius = barWidth / 2;
        ctx.roundRect(x, 0, barWidth, barHeight, radius);

        if (isActiveBar) {
          if (i >= barCount - 1) {
            ctx.fillStyle = "#ef4444"; // Red peak
          } else if (i >= barCount - 2) {
            ctx.fillStyle = "#fbbf24"; // Amber warning
          } else {
            ctx.fillStyle = "#34d399"; // Emerald active
          }
        } else {
          ctx.fillStyle = "rgba(100, 116, 139, 0.35)"; // Slate idle
        }
        ctx.fill();
      }

      if (isActive) {
        animFrameRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      isRunning = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (internalSourceRef.current) {
        internalSourceRef.current.disconnect();
        internalSourceRef.current = null;
      }
      if (internalAudioCtxRef.current) {
        internalAudioCtxRef.current.close().catch(() => {});
        internalAudioCtxRef.current = null;
      }
    };
  }, [stream, externalAnalyser, isActive, barCount, width, height, hasAudioTrack]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-black/75 px-2 py-1 backdrop-blur-xs border border-slate-700/60 shadow-xs",
        className
      )}
      role="meter"
      aria-label="Audio VU Level"
      aria-valuenow={0}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {showIcon &&
        (hasAudioTrack ? (
          <Mic
            ref={iconRef}
            className="h-3 w-3 shrink-0 text-slate-400 transition-colors"
            aria-hidden="true"
          />
        ) : (
          <MicOff
            className="h-3 w-3 shrink-0 text-red-400 transition-colors"
            aria-hidden="true"
          />
        ))}
      <canvas
        ref={canvasRef}
        className="block shrink-0"
        aria-hidden="true"
      />
    </div>
  );
}
